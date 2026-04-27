import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { PaginatedResult } from '@/common/types/paginated-result.type';

function isPaginated<T>(val: unknown): val is PaginatedResult<T> {
  return (
    typeof val === 'object' &&
    val !== null &&
    'data' in val &&
    Array.isArray((val as PaginatedResult<T>).data) &&
    'meta' in val
  );
}

interface HttpResponse {
  statusCode: number;
}

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const response = context.switchToHttp().getResponse<HttpResponse>();
    const statusCode = response.statusCode;
    return next.handle().pipe(
      map((value: unknown) => {
        if (isPaginated(value)) {
          return { statusCode, data: value.data, meta: value.meta };
        }
        return { statusCode, data: value };
      }),
    );
  }
}
