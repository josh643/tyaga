import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { WorkShare } from './work-share.entity';

@Entity('rightsholders')
export class Rightsholder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string; // Legal name or pseudonym

  @Column({ nullable: true })
  ipi_number: string; // Interested Party Information number (assigned by PRO)

  @Column({ nullable: true })
  role: string; // 'Writer', 'Publisher', 'Administrator'

  @OneToMany(() => WorkShare, (share) => share.rightsholder)
  shares: WorkShare[];
}
