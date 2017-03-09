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

  protected multiFormParams($body: d3.Selection<any>, dataSize?): IMultiFormOptions {
    return {
      all: {
        width: $body.property('clientWidth'),
        heightTo: $body.property('clientHeight'),
      }
    };
  }

  protected buildBody($body: d3.Selection<any>) {
    //  this.multiform = new MultiForm(this.data, <HTMLElement>$body.node(), this.multiFormParams($body));
  }

  protected buildToolbar($toolbar: d3.Selection<any>) {
    // if (this.multiform) {
    //const $visList = $toolbar.append('div').classed('vislist', true);
    // this.multiform.addIconVisChooser(<HTMLElement>$visList.node());
    // }
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

  private replaceMultiForm(data: IDataType, $body: d3.Selection<any>) {
    //const dom = $body.append('div');
    // const m = new MultiForm(data, <HTMLElement>$body.node(), this.multiFormParams($body, (<any>data).length));
    //  const d = dom.append('div');
    // m.addIconVisChooser(<HTMLElement>d.node());


    // const $visList = $toolbar.append('div').classed('vislist', true);
    //this.multiform.addIconVisChooser(<HTMLElement>$visList.node());
    // m.on('changed', (evt, d) => console.log(d))
    // this.calculateMultiformDimension(m, $body)

    // const $visList = this.toolbar.select('div.vislist');
    // $visList.html(''); // clear old
    // m.addIconVisChooser(<HTMLElement>$visList.node());

    this.updateSortIcon();
    //return m;
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


  calculateMultiformDimension(m, $body) {

    const width = $body.property('clientWidth');
    const height = $body.property('clientHeight');
    const dataElements = m.data.length;
    const minHeight = dataElements * this.minimumHeight;
    const requiredHeight = dataElements * this.preferredHeight;
    //const requiredColHeight = requiredHeight * this.countMultiform;

    if (requiredHeight < height) {

      scaleTo(m, width, requiredHeight, this.orientation);
    } else {

      scaleTo(m, width, minHeight, this.orientation);
    }

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


  async updateList(idRanges: Range[]) {
    this.body.selectAll('.multiformList').remove();
    this.multiformList = [];
    for (const r of idRanges) {
      const li = this.body.append('li').classed('multiformList', true);
      const view = await this.data.idView(r);
      const m = new MultiForm(view, <HTMLElement>li.node(), this.multiFormParams(li, (<any>view).length));
      this.multiformList.push(m);
    }

  }


}

export default AVectorColumn;
