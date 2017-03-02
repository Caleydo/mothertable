import AColumn, {EOrientation} from './AColumn';
import {IVector} from 'phovea_core/src/vector';
import {IStringValueTypeDesc, IDataType} from 'phovea_core/src/datatype';
import Range from 'phovea_core/src/range/Range';
import {MultiForm, IMultiFormOptions} from 'phovea_core/src/multiform';
import {SORT} from '../SortEventHandler/SortEventHandler';
import {scaleTo} from './utils';
import * as d3 from 'd3';

/**
 * Created by Samuel Gratzl on 19.01.2017.
 */

export declare type IStringVector = IVector<string, IStringValueTypeDesc>;

export abstract class AVectorColumn<T, DATATYPE extends IVector<T, any>> extends AColumn<T, DATATYPE> {
  protected multiform: MultiForm;
  dataView: IDataType;
  static readonly EVENT_SORTBY_COLUMN_HEADER = 'sortByMe';


  constructor(data: DATATYPE, orientation: EOrientation) {
    super(data, orientation);
    this.dataView = data;

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
    toolbar.insertAdjacentHTML('beforeend', `<button class="fa sort fa-sort-amount-asc"></button>`);
    const sortButton = <HTMLElement>toolbar.querySelector('button.fa-sort-amount-asc');
    this.getSortMethod(sortButton);
    super.buildToolbar(toolbar);
  }

  private replaceMultiForm(data: IDataType, body: HTMLElement) {

    const m = new MultiForm(data, body, this.multiFormParams());
    const vislist = <HTMLElement>this.toolbar.querySelector('div.vislist');
    vislist.innerHTML = ''; // clear old
    m.addIconVisChooser(vislist);
    this.updateSortIcon();
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

  protected getSortMethod(sortButton:HTMLElement) {
    sortButton.addEventListener('click', () => {
      const b = d3.select(sortButton);
      if (b.classed('fa-sort-amount-asc')) {
        // const sortMethod = SORT.desc;
        this.sortCriteria = SORT.desc;
        this.fire(AVectorColumn.EVENT_SORTBY_COLUMN_HEADER, this);
        b.attr('class', 'fa sort fa-sort-amount-desc');
      } else {
        this.sortCriteria = SORT.asc;
        this.fire(AVectorColumn.EVENT_SORTBY_COLUMN_HEADER, this);

        b.attr('class', 'fa sort fa-sort-amount-asc');
      }
    });

  }

  updateSortIcon() {
    if (this.sortCriteria === SORT.desc) {
      const s = d3.select(this.node).select('.fa.sort.fa-sort-amount-asc');
      s.attr('class', 'fa sort fa-sort-amount-desc');
    }
    if (this.sortCriteria === SORT.asc) {
      const s = d3.select(this.node).select('.fa.sort.fa-sort-amount-desc');
      s.attr('class', 'fa sort fa-sort-amount-asc');
    }
  }


  async update(idRange: Range) {
    this.multiform.destroy();
    const view = await this.data.idView(idRange);
    this.dataView = view;
    this.multiform = this.replaceMultiForm(view, this.body);
  }

}

export default AVectorColumn;
