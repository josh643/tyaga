import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { MusicalWork } from './musical-work.entity';
import { Rightsholder } from './rightsholder.entity';

@Entity('work_shares')
export class WorkShare {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => MusicalWork, (work) => work.shares)
  @JoinColumn({ name: 'musical_work_id' })
  musicalWork: MusicalWork;

  @ManyToOne(() => Rightsholder, (holder) => holder.shares)
  @JoinColumn({ name: 'rightsholder_id' })
  rightsholder: Rightsholder;

  // Percentage of ownership (0-100)
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  mechanical_percent: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  performance_percent: number;
}
