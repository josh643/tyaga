import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Campaign } from '../entities/campaign.entity';

@Injectable()
export class CampaignsService {
  constructor(
    @InjectRepository(Campaign)
    private campaignsRepository: Repository<Campaign>,
  ) {}

  findAll(): Promise<Campaign[]> {
    return this.campaignsRepository.find();
  }

  create(campaign: Partial<Campaign>): Promise<Campaign> {
    const newCampaign = this.campaignsRepository.create(campaign);
    return this.campaignsRepository.save(newCampaign);
  }

  async trigger(id: string): Promise<Campaign> {
    const campaign = await this.campaignsRepository.findOneBy({ id });
    if (campaign) {
      campaign.status = 'Active';
      return this.campaignsRepository.save(campaign);
    }
    throw new Error('Campaign not found');
  }
}
