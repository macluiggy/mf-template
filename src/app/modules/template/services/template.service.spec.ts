import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../../environments/environment';
import { TemplateService } from './template.service';

describe('TemplateService', () => {
  let service: TemplateService;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(TemplateService);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  it('lists records with pagination', () => {
    let total = 0;
    service.list({ limit: 10, page: 2, search: 'abc' }).subscribe((res) => {
      total = res.data.total;
    });

    const req = controller.expectOne(
      (r) => r.url === `${environment.apiUrl}/template` && r.method === 'GET',
    );
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('limit')).toBe('10');
    expect(req.request.params.get('search')).toBe('abc');

    req.flush({
      data: { page: 2, records: [], total: 7, totalPage: 1 },
      message: 'ok',
    });
    expect(total).toBe(7);
  });

  it('omits an empty search term', () => {
    service.list({ limit: 10, page: 1, search: '' }).subscribe();

    const req = controller.expectOne((r) => r.url.endsWith('/template'));
    expect(req.request.params.has('search')).toBe(false);
    req.flush({
      data: { page: 1, records: [], total: 0, totalPage: 0 },
      message: 'ok',
    });
  });
});
