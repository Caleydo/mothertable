import AColumn, {EOrientation} from './AColumn';
import {IVector} from 'phovea_core/src/vector';
import {IStringValueTypeDesc, IDataType} from 'phovea_core/src/datatype';
import Range1D from 'phovea_core/src/range/Range1D';
import {MultiForm, IMultiFormOptions} from 'phovea_core/src/multiform';
import {list as rlist} from 'phovea_core/src/range';
import SortColumn from './SortColumn';
import {SORT} from './SortColumn';
import {scaleTo} from './utils';
import * as d3 from 'd3';
/**
 * Created by Samuel Gratzl on 19.01.2017.
 */

export declare type IStringVector = IVector<string, IStringValueTypeDesc>;

export abstract class AVectorColumn<T, DATATYPE extends IVector<T, any>> extends AColumn<T, DATATYPE> {
  protected multiform: MultiForm;
  dataView: DATATYPE;
  filterRange;
  static readonly EVENT_SORT_CHANGED = 'sorted';
  static readonly EVENT_SORT_METHOD = 'sortMe';
  private sort: SortColumn;
  private sortCriteria: string = null;

  constructor(data: DATATYPE, orientation: EOrientation) {
    super(data, orientation);
    this.dataView = data;
    this.sort = new SortColumn(this.dataView, this.sortCriteria)

  }

  protected multiFormParams(): IMultiFormOptions {
    return {};
  }

  protected buildBody(body: HTMLElement) {
    this.multiform = new MultiForm(this.data, body, this.multiFormParams());
  }

  protected buildToolbar(toolbar: HTMLElement) {
    toolbar.insertAdjacentHTML('afterbegin', `<div class="vislist"></div>`);
    if (this.multiform) {
      const vislist = <HTMLElement>toolbar.querySelector('div.vislist');
      this.multiform.addIconVisChooser(vislist);
    }
    toolbar.insertAdjacentHTML('beforeend', `<button class="fa sort fa-sort-amount-desc"></button>`);
    const sortButton = toolbar.querySelector('button.fa-sort-amount-desc');

    this.getSortMethod(sortButton);
    super.buildToolbar(toolbar);
  }

  private replaceMultiForm(data: IDataType, body: HTMLElement) {
    const m = new MultiForm(data, body, this.multiFormParams());
    const vislist = <HTMLElement>this.toolbar.querySelector('div.vislist');
    vislist.innerHTML = ''; // clear old
    m.addIconVisChooser(vislist);
    return m;
  }

  layout(width: number, height: number) {
    scaleTo(this.multiform, width, height, this.orientation);
  }

  // update(idRange: Range1D) {
  //   this.multiform.destroy();
  //   this.data.idView(rlist(idRange)).then((view) => {
  //     this.multiform = this.replaceMultiForm(view, this.body);
  //   });
  // }

  protected getSortMethod(sortButton) {

    sortButton.addEventListener('click', () => {
      const b = d3.select(sortButton);
      if (b.classed('fa-sort-amount-desc')) {
        const sortMethod = SORT.asc;
        this.fire(AVectorColumn.EVENT_SORT_METHOD, sortMethod, this.data);
        b.attr('class', 'fa sort fa-sort-amount-asc');
      } else {
        const sortMethod = SORT.desc;
        this.fire(AVectorColumn.EVENT_SORT_METHOD, sortMethod, this.data);
        b.attr('class', 'fa sort fa-sort-amount-desc');
      }
    });
  }


  async update(idRange: Range1D) {
    this.multiform.destroy();
    const view = await (<any>this.data).idView(idRange);
    this.dataView = view;

    this.multiform = this.replaceMultiForm(view, this.body);
  }

}

export default AVectorColumn;
