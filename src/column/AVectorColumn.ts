/**
 * Created by Samuel Gratzl on 19.01.2017.
 */

import AColumn, {EOrientation} from './AColumn';
import {IVector} from 'phovea_core/src/vector';
import {IStringValueTypeDesc, IDataType} from 'phovea_core/src/datatype';
import Range from 'phovea_core/src/range/Range';
import {IMultiFormOptions} from 'phovea_core/src/multiform';
import {SORT} from '../SortEventHandler/SortEventHandler';
import {scaleTo} from './utils';
import * as d3 from 'd3';
import MultiForm from 'phovea_core/src/multiform/MultiForm';
import {VALUE_TYPE_INT, VALUE_TYPE_REAL} from 'phovea_core/src/datatype';
import NumberColumn from "./NumberColumn";
export declare type IStringVector = IVector<string, IStringValueTypeDesc>;

export abstract class AVectorColumn<T, DATATYPE extends IVector<T, any>> extends AColumn<T, DATATYPE> {
  multiform: MultiForm;
  dataView: IDataType;
  static readonly EVENT_SORTBY_COLUMN_HEADER = 'sortByMe';
  multiformList = [];

  constructor(data: DATATYPE, orientation: EOrientation) {
    super(data, orientation);
    this.dataView = data;
    this.rangeView = (<any>data).indices;

  }

  protected multiFormParams($body: d3.Selection<any>, domain?): IMultiFormOptions {
    return {
      all: {
        width: $body.property('clientWidth'),
        heightTo: $body.property('clientHeight'),
        sort: this.sortCriteria
      }
    };
  }

  protected buildBody($body: d3.Selection<any>) {
    //  this.multiform = new MultiForm(this.data, <HTMLElement>$body.node(), this.multiFormParams($body));
  }

  protected buildToolbar($toolbar: d3.Selection<any>) {
    const $sortButton = $toolbar.append('button')
      .attr('class', 'fa sort fa-sort-amount-asc')
      .on('click', () => {
        if ($sortButton.classed('fa-sort-amount-asc')) {
          // const sortMethod = SORT.desc;
          this.sortCriteria = SORT.desc;
          this.fire(AVectorColumn.EVENT_SORTBY_COLUMN_HEADER, this);
          $sortButton.attr('class', 'fa sort fa-sort-amount-desc');
        } else {
          this.sortCriteria = SORT.asc;
          this.fire(AVectorColumn.EVENT_SORTBY_COLUMN_HEADER, this);
          $sortButton.attr('class', 'fa sort fa-sort-amount-asc');
        }
      });
    super.buildToolbar($toolbar);
  }


  layout(width: number, height: number) {

    scaleTo(this.multiform, width, height, this.orientation);
  }


  updateSortIcon() {
    if (this.sortCriteria === SORT.desc) {
      const s = this.$node.select('.fa.sort.fa-sort-amount-asc');
      s.attr('class', 'fa sort fa-sort-amount-desc');
    }
    if (this.sortCriteria === SORT.asc) {
      const s = this.$node.select('.fa.sort.fa-sort-amount-desc');
      s.attr('class', 'fa sort fa-sort-amount-asc');
    }
  }

  async update(idRange: Range) {
    this.$node.select('main').remove();
    this.$node.append('main');
    //  this.multiform.destroy();
    const view = await this.data.idView(idRange);
    this.dataView = view;
    //  this.replaceMultiForm(view, this.body);

  }

  async updateMultiForms(idRanges) {

    // this.updateSortIcon();
    this.body.selectAll('.multiformList').remove();
    this.multiformList = [];
    const v: any = await this.data.data();
    const domain = d3.extent(v);
    for (const r of idRanges) {
      const li = this.body.append('li').classed('multiformList', true);
      const $header = li.append('div').classed('vislist', true);
      this.body.selectAll('.multiformList').on('mouseover', function () {
        d3.select(this).select('.vislist').style('display', 'block');
      })
        .on('mouseleave', function () {
          d3.select(this).select('.vislist').style('display', 'none');
        });
      const view = await this.data.idView(r);
      const m = new MultiForm(view, <HTMLElement>li.node(), this.multiFormParams(li, domain));
      m.addIconVisChooser(<HTMLElement>$header.node())
      this.multiformList.push(m);
    }


  }


}

export default AVectorColumn;
