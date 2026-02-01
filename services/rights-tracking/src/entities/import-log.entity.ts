import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export enum ImportStatus {
  PENDING = 'PENDING',
  PROCESSED = 'PROCESSED',
  FAILED = 'FAILED',
}

@Entity('import_logs')
export class ImportLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  source: string; // e.g., 'DistroKid', 'Tunecore', 'CWR'

  @Column({ type: 'jsonb', nullable: true })
  raw_data: any; // Stores the full original payload

  @Column({ type: 'enum', enum: ImportStatus, default: ImportStatus.PENDING })
  status: ImportStatus;

  @Column({ nullable: true })
  error_message: string;

  @CreateDateColumn()
  created_at: Date;
}
