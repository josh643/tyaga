import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Campaign {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ default: 'Draft' })
  status: string; // 'Draft' | 'Active' | 'Completed'

  @Column()
  platform: string;

  @Column({ nullable: true })
  contentStrategy: string;
}
