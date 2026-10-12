import { type ComponentFixture, TestBed } from '@angular/core/testing';
import type { TemplateInterface } from '../../interfaces/template.interface';
import { TemplateTableComponent } from './template-table.component';

describe('TemplateTableComponent', () => {
  let fixture: ComponentFixture<TemplateTableComponent>;
  let element: HTMLElement;

  const items: TemplateInterface[] = [
    { id: 1, name: 'First', status: true },
    { id: 2, name: 'Second', status: false },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TemplateTableComponent] }).compileComponents();
    fixture = TestBed.createComponent(TemplateTableComponent);
    element = fixture.nativeElement as HTMLElement;
  });

  it('renders one row per item', async () => {
    fixture.componentRef.setInput('items', items);
    await fixture.whenStable();

    const rows = element.querySelectorAll('tbody tr');
    expect(rows.length).toBe(2);
    expect(rows[0].textContent).toContain('First');
    expect(rows[1].textContent).toContain('Inactive');
  });

  it('renders the empty state when there are no items', async () => {
    fixture.componentRef.setInput('items', []);
    await fixture.whenStable();

    expect(element.textContent).toContain('No records found');
  });

  it('emits the selected item when a row button is clicked', async () => {
    fixture.componentRef.setInput('items', items);
    await fixture.whenStable();
    const selected: TemplateInterface[] = [];
    fixture.componentInstance.selected.subscribe((item) => selected.push(item));

    element.querySelector<HTMLButtonElement>('tbody tr:nth-child(2) button')?.click();

    expect(selected).toEqual([items[1]]);
  });
});
