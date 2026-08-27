import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';

import { User } from '../users/user.entity';

@Entity()
export class Incident {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column('decimal')
  lat!: number;

  @Column('decimal')
  lon!: number;

  @Column()
  type!: string;

  @Column()
  severity!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ nullable: true })
  image!: string; //fs, bucket mass storage

  @Column({ type: 'text', nullable: true })
  address!: string;

  @Column({ default: 1 })
  reportCount!: number;

  @Column({ default: 0 })
  resolveCount!: number;

  @Column({ default: 'active' })
  status!: 'active' | 'resolved';

  @Column({ type: 'timestamp', nullable: true })
  resolvedAt!: Date | null;

  @ManyToOne(() => User)
  @JoinColumn()
  reportedBy!: User;

  @CreateDateColumn()
  createdAt!: Date;
}
