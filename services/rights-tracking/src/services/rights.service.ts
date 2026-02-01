import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MusicalWork } from '../entities/musical-work.entity';
import { Rightsholder } from '../entities/rightsholder.entity';
import { WorkShare } from '../entities/work-share.entity';
import { CreateWorkDto } from '../dto/create-work.dto';
import { MinioService } from './minio.service';

@Injectable()
export class RightsService {
  constructor(
    @InjectRepository(MusicalWork)
    private worksRepository: Repository<MusicalWork>,
    @InjectRepository(Rightsholder)
    private rightsholdersRepository: Repository<Rightsholder>,
    @InjectRepository(WorkShare)
    private sharesRepository: Repository<WorkShare>,
    private minioService: MinioService,
  ) {}

  async createWork(createWorkDto: CreateWorkDto, file?: Express.Multer.File): Promise<MusicalWork> {
    // 1. Create the Work
    const work = this.worksRepository.create({
      title: createWorkDto.title,
      iswc: createWorkDto.iswc,
    });

    if (file) {
      const key = await this.minioService.uploadFile(file.originalname, file.buffer);
      work.audio_file_key = key;
      work.audio_file_name = file.originalname;
    }

    await this.worksRepository.save(work);

    // 2. Create Rightsholders and Shares
    if (createWorkDto.writers) {
        // Parse if sent as JSON string from multipart form
        const writers = typeof createWorkDto.writers === 'string' 
            ? JSON.parse(createWorkDto.writers) 
            : createWorkDto.writers;

        for (const writer of writers) {
        let holder = await this.rightsholdersRepository.findOne({ where: { name: writer.name } });
        
        if (!holder) {
            holder = this.rightsholdersRepository.create({
            name: writer.name,
            ipi_number: writer.ipi,
            role: 'Writer',
            });
            await this.rightsholdersRepository.save(holder);
        }

        const share = this.sharesRepository.create({
            musicalWork: work,
            rightsholder: holder,
            performance_percent: writer.performanceSplit,
            mechanical_percent: writer.mechanicalSplit,
        });
        await this.sharesRepository.save(share);
        }
    }

    return this.worksRepository.findOne({ where: { id: work.id }, relations: ['shares', 'shares.rightsholder'] });
  }

  async findAll(): Promise<MusicalWork[]> {
    const works = await this.worksRepository.find({ relations: ['shares', 'shares.rightsholder'] });
    // Append temporary presigned URLs for playback
    for (const work of works) {
        if (work.audio_file_key) {
            (work as any).audioUrl = await this.minioService.getFileUrl(work.audio_file_key);
        }
    }
    return works;
  }
}
