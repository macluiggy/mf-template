import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { PubSubService } from '../../../../shared/services/pubsub.service';
import { TemplateService } from '../../services/template.service';
import { TemplateListPage } from './template-list.page';

describe('TemplateListPage', () => {
  const pubsub = { loading: vi.fn(), error: vi.fn() };

  async function render(list: TemplateService['list']) {
    await TestBed.configureTestingModule({
      imports: [TemplateListPage],
      providers: [
        { provide: TemplateService, useValue: { list } },
        { provide: PubSubService, useValue: pubsub },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(TemplateListPage);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  beforeEach(() => vi.clearAllMocks());

  it('loads the first page and renders the records', async () => {
    const list = vi.fn(() =>
      of({
        data: {
          records: [{ id: 1, name: 'First', status: true }],
          total: 1,
          page: 1,
          totalPage: 1,
        },
        message: 'ok',
      }),
    );

    const element = await render(list);

    expect(list).toHaveBeenCalledWith({ page: 1, limit: 10 });
    expect(element.textContent).toContain('First');
    expect(pubsub.loading).toHaveBeenNthCalledWith(1, true);
    expect(pubsub.loading).toHaveBeenLastCalledWith(false);
  });

  it('shows the error state and notifies the host when loading fails', async () => {
    const element = await render(vi.fn(() => throwError(() => new Error('boom'))));

    expect(element.querySelector('[role="alert"]')).not.toBeNull();
    expect(pubsub.error).toHaveBeenCalledOnce();
  });
});
