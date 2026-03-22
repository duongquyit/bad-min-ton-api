import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { EMPTY, Observable, of } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { LinksHelper } from '../helpers/links.helper';
import type { ApiResponse } from '../helpers/response.helper';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();

    return next.handle().pipe(
      mergeMap((value: ApiResponse) => {
        switch (value._type) {
          case 'ok':
            response.status(200);
            return of({ data: value.data });

          case 'created':
            response.status(201);
            return of({ data: value.data });

          case 'noContent':
            response.status(204).end();
            return EMPTY;

          case 'list': {
            const existingQuery = { ...request.query };
            delete existingQuery['page'];
            delete existingQuery['limit'];
            const baseUrl = `${request.protocol}://${request.get('host')}${request.path}`;
            const links = LinksHelper.build(baseUrl, value.pagination, existingQuery);
            response.status(200);
            return of({
              data: {
                items: value.items,
                pagination: value.pagination,
                links,
              },
            });
          }

          default:
            return of(value);
        }
      }),
    );
  }
}
