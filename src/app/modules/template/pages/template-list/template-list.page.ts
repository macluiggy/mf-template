import { ChangeDetectionStrategy, Component, inject, type OnInit, signal } from '@angular/core';
import { TemplateTableComponent } from '../../components/template-table/template-table.component';
import { TEMPLATE_PAGE_SIZE } from '../../constants/template.constants';
import type { TemplateInterface } from '../../interfaces/template.interface';
import { TemplateService } from '../../services/template.service';

type ViewState = 'loading' | 'error' | 'ready';

/**
 * Container page: owns state (signals) and calls the service, including the
 * loading and error states. Rendering is delegated to presentational components.
 */
@Component({
  selector: 'app-template-list-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TemplateTableComponent],
  templateUrl: './template-list.page.html',
})
export class TemplateListPage implements OnInit {
  private readonly service = inject(TemplateService);

  protected readonly state = signal<ViewState>('loading');
  protected readonly items = signal<TemplateInterface[]>([]);
  protected readonly total = signal(0);
  protected readonly page = signal(1);
  protected readonly lastSelected = signal<TemplateInterface | null>(null);

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.state.set('loading');
    this.service.list({ page: this.page(), limit: TEMPLATE_PAGE_SIZE }).subscribe({
      next: (res) => {
        this.items.set(res.data.records);
        this.total.set(res.data.total);
        this.state.set('ready');
      },
      error: () => this.state.set('error'),
    });
  }

  protected onSelected(item: TemplateInterface): void {
    this.lastSelected.set(item);
  }
}
