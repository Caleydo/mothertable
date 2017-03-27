/**
 * Created by Samuel Gratzl on 19.01.2017.
 */

import AColumn, {EOrientation} from './AColumn';
import {IVector} from 'phovea_core/src/vector';
import {IStringValueTypeDesc, IDataType} from 'phovea_core/src/datatype';
import Range from 'phovea_core/src/range/Range';
import {IMultiFormOptions} from 'phovea_core/src/multiform';
import {SORT} from '../SortHandler/SortHandler';
import * as d3 from 'd3';
import MultiForm from 'phovea_core/src/multiform/MultiForm';
import TaggleMultiform from './TaggleMultiform';
import VisManager from './VisManager';
import {EAggregationType} from './VisManager';
import {on, fire} from 'phovea_core/src/event';
export declare type IStringVector = IVector<string, IStringValueTypeDesc>;

export abstract class AVectorColumn<T, DATATYPE extends IVector<T, any>> extends AColumn<T, DATATYPE> {

  static readonly EVENT_SORTBY_COLUMN_HEADER = 'sortByMe';

  multiform: MultiForm;
  dataView: IDataType;
  multiformList: TaggleMultiform[] = [];

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
        sort: this.sortCriteria,
        orientation: this.orientation
      }
    };
  }

  protected buildToolbar($toolbar: d3.Selection<any>) {
    const $sortButton = $toolbar.append('a')
      .attr('title', 'Sort descending')
      .html(`<i class="fa fa-sort-amount-asc fa-fw" aria-hidden="true"></i><span class="sr-only">Sort descending</span>`);

    const onClick = (sort: string) => {
      if (sort === SORT.desc) {
        $sortButton
          .attr('title', 'Sort ascending')
          .html(`<i class="fa fa-sort-amount-desc fa-fw" aria-hidden="true"></i><span class="sr-only">Sort ascending</span>`);

      } else {
        $sortButton
          .attr('title', 'Sort descending')
          .html(`<i class="fa fa-sort-amount-asc fa-fw" aria-hidden="true"></i><span class="sr-only">Sort descending</span>`);

      }
    };

    $sortButton.on('click', () => {
      this.fire(AVectorColumn.EVENT_SORTBY_COLUMN_HEADER, this);
      if ($sortButton.select('i').classed('fa-sort-amount-asc')) {
        const sortData = {sortMethod: SORT.desc, col: this};
        fire(AVectorColumn.EVENT_SORTBY_COLUMN_HEADER, sortData);

      } else {
        const sortData = {sortMethod: SORT.asc, col: this};
        fire(AVectorColumn.EVENT_SORTBY_COLUMN_HEADER, sortData);
      }
    });

    on(AVectorColumn.EVENT_SORTBY_COLUMN_HEADER, (evt: any, sortData) => {
      if (this.data.desc.id === sortData.col.data.desc.id) {
        onClick(sortData.sortMethod);
      }
    });


    super.buildToolbar($toolbar);
  }

  private updateSortIcon() {


    if (this.sortCriteria === SORT.desc) {
      console.log(this.sortCriteria, 'desc')
      this.$node.select('i').classed('fa fa-sort-amount-asc fa-fw', false);
      this.$node.select('i').classed('fa fa-sort-amount-desc fa-fw', true)
        .attr('title', 'Sort ascending')
        .html(`<i class="sort fa fa-sort-amount-asc fa-fw" aria-hidden="true"></i><span class="sr-only">Sort ascending</span>`);


    } else if (this.sortCriteria === SORT.asc) {
      console.log(this.sortCriteria, 'asc')
      this.$node.select('i').classed('fa fa-sort-amount-desc fa-fw', false)
      this.$node.select('i').classed('fa fa-sort-amount-asc fa-fw', true)
        .attr('title', 'Sort descending')
        .html(`<i class="fa fa-sort-amount-asc fa-fw" aria-hidden="true"></i><span class="sr-only">Sort descending</span>`);

    }
  }

  async updateMultiForms(multiformRanges: Range[], stratifiedRanges?: Range[], brushedRanges?: Range[]) {
    const v: any = await this.data.data(); // wait first for data and then continue with removing old forms
    const domain = d3.extent(v);

    const viewPromises = multiformRanges.map((r) => this.data.idView(r));

    return Promise.all(viewPromises).then((views) => {
   //   this.updateSortIcon();

      this.body.selectAll('.multiformList').remove();
      this.multiformList = [];

      views.forEach((view, id) => {
        const $multiformDivs = this.body.append('div').classed('multiformList', true);

        const m = new TaggleMultiform(view, <HTMLElement>$multiformDivs.node(), this.multiFormParams($multiformDivs, domain));
        m.groupId = this.findGroupId(stratifiedRanges, multiformRanges[id]);
        m.brushed = this.checkBrushed(brushedRanges, multiformRanges[id]);

        //assign visses
        if (this.selectedAggVis) {
          VisManager.userSelectedAggregatedVisses.set(m.id, this.selectedAggVis);
        }
        if (this.selectedUnaggVis) {
          VisManager.userSelectedUnaggregatedVisses.set(m.id, this.selectedUnaggVis);
        }
        VisManager.multiformAggregationType.set(m.id, EAggregationType.UNAGGREGATED);

        this.multiformList.push(m);
      });

      return this.multiformList;
    });
  }


}

export default AVectorColumn;
