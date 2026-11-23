import {
  ChangeDetectionStrategy,
  Component,
  inject,
  type OnInit,
  signal,
} from '@angular/core';

import { LoadingTrackerService } from '../../../../shared/services/loading-tracker.service';
import { TemplateTableComponent } from '../../components/template-table/template-table.component';
import { TEMPLATE_PAGE_SIZE } from '../../constants/template.constants';
import type { TemplateInterface } from '../../interfaces/template.interface';
import { TemplateService } from '../../services/template.service';

type ViewState = 'loading' | 'error' | 'ready';

/**
 * Container page: owns state (signals), calls the service and reports the
 * loader through the `LoadingTrackerService` port. A failed request shows its
 * message through the HTTP error interceptor, so the page only switches to its
 * own error state. Rendering is delegated to presentational components.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TemplateTableComponent],
  selector: 'app-template-list-page',
  standalone: true,
  templateUrl: './template-list.page.html',
})
export class TemplateListPage implements OnInit {
  private readonly service = inject(TemplateService);
  private readonly loading = inject(LoadingTrackerService);

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
    this.service
      .list({ limit: TEMPLATE_PAGE_SIZE, page: this.page() })
      .pipe(this.loading.track)
      .subscribe({
        error: () => {
          // The toast is the HTTP error interceptor's job (one message, not two).
          this.state.set('error');
        },
        next: (res) => {
          this.items.set(res.data.records);
          this.total.set(res.data.total);
          this.state.set('ready');
        },
      });
  }

  protected onSelected(item: TemplateInterface): void {
    this.lastSelected.set(item);
  }
}
