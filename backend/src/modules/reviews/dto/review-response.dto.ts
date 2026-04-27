import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Review } from '@/modules/reviews/entities/review.entity';

export class ReviewResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  movieId: string;

  @ApiProperty()
  rating: number;

  @ApiPropertyOptional({ nullable: true })
  comment: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static from(review: Review): ReviewResponseDto {
    const dto = new ReviewResponseDto();
    dto.id = review.id;
    dto.userId = review.userId;
    dto.movieId = review.movieId;
    dto.rating = review.rating;
    dto.comment = review.comment;
    dto.createdAt = review.createdAt;
    dto.updatedAt = review.updatedAt;
    return dto;
  }
}
