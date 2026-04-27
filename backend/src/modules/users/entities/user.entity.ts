import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { WatchlistEntry } from '@/modules/watchlist/entities/watchlist-entry.entity';
import { Review } from '@/modules/reviews/entities/review.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @Column()
  name: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => WatchlistEntry, (e) => e.user, { cascade: true })
  watchlistEntries: WatchlistEntry[];

  @OneToMany(() => Review, (r) => r.user, { cascade: true })
  reviews: Review[];
}
