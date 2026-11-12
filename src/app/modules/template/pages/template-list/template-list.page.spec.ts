import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { providePubSubMock } from '../../../../../testing';
import { TemplateService } from '../../services/template.service';
import { TemplateListPage } from './template-list.page';

describe('TemplateListPage', () => {
  const { mock: pubsub, providers: pubsubProviders } = providePubSubMock();

  async function render(list: TemplateService['list']) {
    await TestBed.configureTestingModule({
      imports: [TemplateListPage],
      providers: [
        { provide: TemplateService, useValue: { list } },
        ...pubsubProviders,
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(TemplateListPage);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  beforeEach(() => vi.clearAllMocks());

  it('loads the first page and renders the records', async () => {
    const list = vi.fn<TemplateService['list']>(() =>
      of({
        data: {
          page: 1,
          records: [{ id: 1, name: 'First', status: true }],
          total: 1,
          totalPage: 1,
        },
        message: 'ok',
      }),
    );

    const element = await render(list);

    expect(list).toHaveBeenCalledWith({ limit: 10, page: 1 });
    expect(element.textContent).toContain('First');
    expect(pubsub.loading).toHaveBeenNthCalledWith(1, true);
    expect(pubsub.loading).toHaveBeenLastCalledWith(false);
  });

  it('shows the error state and notifies the host when loading fails', async () => {
    const element = await render(
      vi.fn<TemplateService['list']>(() => throwError(() => new Error('boom'))),
    );

    expect(element.querySelector('[role="alert"]')).not.toBeNull();
    expect(pubsub.error).toHaveBeenCalledOnce();
  });
});
