import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { MusicalWork } from './musical-work.entity';

@Entity('recordings')
export class Recording {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  isrc: string; // International Standard Recording Code (e.g., US-ABC-23-00001)

  @Column({ nullable: true })
  title: string;

  @Column({ nullable: true })
  artist_name: string;

  @Column({ type: 'date', nullable: true })
  release_date: Date;

  @ManyToOne(() => MusicalWork, (work) => work.recordings)
  @JoinColumn({ name: 'musical_work_id' })
  musicalWork: MusicalWork;

  @CreateDateColumn()
  created_at: Date;
}
