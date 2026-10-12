import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { TemplateService } from '../../services/template.service';
import { TemplateListPage } from './template-list.page';

describe('TemplateListPage', () => {
  async function render(list: TemplateService['list']) {
    await TestBed.configureTestingModule({
      imports: [TemplateListPage],
      providers: [{ provide: TemplateService, useValue: { list } }],
    }).compileComponents();
    const fixture = TestBed.createComponent(TemplateListPage);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

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
    expect(element.querySelector('[role="status"]')).toBeNull();
  });

  it('shows the error state with a retry action when loading fails', async () => {
    const element = await render(vi.fn(() => throwError(() => new Error('boom'))));

    expect(element.querySelector('[role="alert"]')?.textContent).toContain(
      'The records could not be loaded.',
    );
    expect(element.querySelector('button')?.textContent).toContain('Retry');
  });
});
