import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { WorkShare } from './work-share.entity';
import { Recording } from './recording.entity';

@Entity('musical_works')
export class MusicalWork {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ nullable: true, unique: true })
  iswc: string; // International Standard Musical Work Code (e.g., T-123.456.789-0)

  @Column({ nullable: true })
  audio_file_key: string; // Path in MinIO bucket

  @Column({ nullable: true })
  audio_file_name: string; // Original filename

  @OneToMany(() => WorkShare, (share) => share.musicalWork)
  shares: WorkShare[];

  @OneToMany(() => Recording, (recording) => recording.musicalWork)
  recordings: Recording[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
