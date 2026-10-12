import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { MsPrefixEnum } from '../../../shared/enums/ms-prefix.enum';
import { buildPermissionHeaders } from '../../../shared/helpers/permission-headers.helper';
import type {
  PaginationResponseInterface,
  ServiceResponseInterface,
} from '../../../shared/interfaces/response.interface';
import { TemplateAction } from '../enums/template-action.enum';
import type { TemplateInterface, TemplateParamsInterface } from '../interfaces/template.interface';

@Injectable({ providedIn: 'root' })
export class TemplateService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/${MsPrefixEnum.CORE}/template`;

  list(
    params: TemplateParamsInterface,
  ): Observable<ServiceResponseInterface<PaginationResponseInterface<TemplateInterface[]>>> {
    let query = new HttpParams().set('page', params.page).set('limit', params.limit);
    if (params.search) {
      query = query.set('search', params.search);
    }
    return this.http.get<
      ServiceResponseInterface<PaginationResponseInterface<TemplateInterface[]>>
    >(this.baseUrl, {
      params: query,
      headers: buildPermissionHeaders(TemplateAction.RESOURCE, TemplateAction.LIST),
    });
  }
}
