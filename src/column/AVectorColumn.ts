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
import {IHistogram} from 'phovea_core/src/math';
import {AVectorFilter} from '../filter/AVectorFilter';
export declare type IStringVector = IVector<string, IStringValueTypeDesc>;

export interface ITaggleHistogramData {
  domain: number[];
  maxValue: number;
  nbins: number;
}

export abstract class AVectorColumn<T, DATATYPE extends IVector<T, any>> extends AColumn<T, DATATYPE> {

  static readonly EVENT_SORTBY_COLUMN_HEADER = 'sortByMe';

  multiform: MultiForm;
  dataView: IDataType;
  private $sortButton: d3.Selection<any>;

  constructor(data: DATATYPE, orientation: EOrientation) {
    super(data, orientation);
    this.dataView = data;
    this.rangeView = (<any>data).indices;
  }

  protected multiFormParams($body: d3.Selection<any>, histogramData?: ITaggleHistogramData): IMultiFormOptions {
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
    this.$sortButton = $toolbar.append('a')
      .attr('title', 'Sort ascending')
      .html(`<i class="fa fa-sort-amount-asc fa-fw" aria-hidden="true"></i><span class="sr-only">Sort ascending</span>`);

    this.$sortButton.on('click', () => {

      this.fire(AVectorColumn.EVENT_SORTBY_COLUMN_HEADER, this);
      if (this.$sortButton.select('i').classed('fa-sort-amount-asc')) {
        const sortData = {sortMethod: SORT.desc, col: this};
        this.fire(AVectorFilter.EVENT_SORTBY_FILTER_ICON, sortData);
        this.updateSortIcon(SORT.desc);
        this.sortCriteria = SORT.desc;
      } else {
        const sortData = {sortMethod: SORT.asc, col: this};
        this.fire(AVectorFilter.EVENT_SORTBY_FILTER_ICON, sortData);
        this.updateSortIcon(SORT.asc);
        this.sortCriteria = SORT.asc;
      }
    });

    super.buildToolbar($toolbar);
  }

  updateSortIcon(sortMethod: string) {
    if (sortMethod === SORT.desc) {
      this.$sortButton
        .attr('title', 'Sort ascending')
        .html(`<i class="fa fa-sort-amount-desc fa-fw" aria-hidden="true"></i><span class="sr-only">Sort descending</span>`);

    } else {
      this.$sortButton
        .attr('title', 'Sort descending')
        .html(`<i class="fa fa-sort-amount-asc fa-fw" aria-hidden="true"></i><span class="sr-only">Sort ascending</span>`);


    }
  }


  async updateMultiForms(multiformRanges: Range[], stratifiedRanges?: Range[], brushedRanges?: Range[]) {
    const that = this;
    const data: any = await this.data.data(); // wait first for data and then continue with removing old  forms
    const histData: IHistogram = await this.data.hist();
    let histogramData;

    if (histData !== null) {
      // get common histogram data for all multiforms
      histogramData = {
        domain: d3.extent(data),
        maxValue: histData.largestBin,
        nbins: histData.bins
      };
    }

    const viewPromises = multiformRanges.map((r) => this.data.idView(r));

    return Promise.all(viewPromises).then((views) => {
      const viewData = views.map((d:any) => {
        return {
          key: d.range.toString(),
          view: d,
        };
      });

      const multiformList = this.body.selectAll('.multiformList').data(viewData, (d) => d.key);

      multiformList.enter().append('div')
        .classed('multiformList', true)
        .each(function(d) {
          const $elem = d3.select(this);
          const m = new TaggleMultiform(d.view, <HTMLElement>$elem.node(), that.multiFormParams($elem, histogramData));
          that.multiformMap.set(d.key, m);
        });

      multiformList
        .each(function(d, i) {
          const m = that.multiformMap.get(d.key);
          m.groupId = that.findGroupId(stratifiedRanges, multiformRanges[i]);
          m.brushed = that.checkBrushed(brushedRanges, multiformRanges[i]);

          //assign visses
          if (that.selectedAggVis) {
            VisManager.userSelectedAggregatedVisses.set(m.id, that.selectedAggVis);
          }
          if (that.selectedUnaggVis) {
            VisManager.userSelectedUnaggregatedVisses.set(m.id, that.selectedUnaggVis);
          }
          VisManager.multiformAggregationType.set(m.id, EAggregationType.UNAGGREGATED);
      });

      multiformList.exit().remove()
        .each(function(d) {
          that.multiformMap.delete(d.key);
        });

      // order DOM elements according to the data order
      multiformList.order();

      return this.multiformList;
    });
  }


}

export default AVectorColumn;
