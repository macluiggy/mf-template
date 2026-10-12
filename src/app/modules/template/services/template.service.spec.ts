import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
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

  it('lists records through the gateway with pagination and permission headers', () => {
    let total = 0;
    service.list({ page: 2, limit: 10, search: 'abc' }).subscribe((res) => {
      total = res.data.total;
    });

    const req = controller.expectOne(
      (r) => r.url === `${environment.apiUrl}/ms-core/template` && r.method === 'GET',
    );
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('limit')).toBe('10');
    expect(req.request.params.get('search')).toBe('abc');
    expect(req.request.headers.get('x-api-key')).toBe('template:listar');

    req.flush({ data: { records: [], total: 7, page: 2, totalPage: 1 }, message: 'ok' });
    expect(total).toBe(7);
  });

  it('omits an empty search term', () => {
    service.list({ page: 1, limit: 10, search: '' }).subscribe();

    const req = controller.expectOne((r) => r.url.endsWith('/ms-core/template'));
    expect(req.request.params.has('search')).toBe(false);
    req.flush({ data: { records: [], total: 0, page: 1, totalPage: 0 }, message: 'ok' });
  });
});
