import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
@Index(['incidentId', 'userId', 'type'], { unique: true })
export class IncidentVote {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  incidentId!: number;

  @Column()
  userId!: number;

  @Column()
  type!: 'report' | 'resolve';
}
