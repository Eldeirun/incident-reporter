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

  @Column({ nullable: true })
  description!: string;

  @Column({ nullable: true })
  image!: string; //fs, bucket mass storage

  @Column({ type: 'text', nullable: true })
  address!: string;

  @Column({ default: 1 })
  reportCount!: number;

  @Column({ default: 0 })
  resolveCount!: number;

  @ManyToOne(() => User)
  @JoinColumn()
  reportedBy!: User;

  @CreateDateColumn()
  createdAt!: Date;
}
