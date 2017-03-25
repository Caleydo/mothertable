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
import {superbag} from './utils';
export declare type IStringVector = IVector<string, IStringValueTypeDesc>;

export abstract class AVectorColumn<T, DATATYPE extends IVector<T, any>> extends AColumn<T, DATATYPE> {

  static readonly EVENT_SORTBY_COLUMN_HEADER = 'sortByMe';

  multiform: MultiForm;
  dataView: IDataType;
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

  protected buildToolbar($toolbar: d3.Selection<any>) {
    const $sortButton = $toolbar.append('a')
      .attr('title', 'Sort descending')
      .html(`<i class="fa fa-sort-amount-asc fa-fw" aria-hidden="true"></i><span class="sr-only">Sort descending</span>`)
      .on('click', () => {
        if ($sortButton.select('i').classed('fa-sort-amount-asc')) {
          this.sortCriteria = SORT.desc;
          this.fire(AVectorColumn.EVENT_SORTBY_COLUMN_HEADER, this);
          $sortButton
            .attr('title', 'Sort ascending')
            .html(`<i class="fa fa-sort-amount-desc fa-fw" aria-hidden="true"></i><span class="sr-only">Sort ascending</span>`);
        } else {
          this.sortCriteria = SORT.asc;
          this.fire(AVectorColumn.EVENT_SORTBY_COLUMN_HEADER, this);
          $sortButton
            .attr('title', 'Sort descending')
            .html(`<i class="fa fa-sort-amount-asc fa-fw" aria-hidden="true"></i><span class="sr-only">Sort descending</span>`);
        }
      });

    super.buildToolbar($toolbar);
  }

  private updateSortIcon() {
    if (this.sortCriteria === SORT.desc) {
      this.$node.select('button.sort')
        .attr('title', 'Sort ascending')
        .html(`<i class="sort fa fa-sort-amount-desc fa-fw" aria-hidden="true"></i><span class="sr-only">Sort ascending</span>`);

    } else if (this.sortCriteria === SORT.asc) {
      this.$node.select('button.sort')
        .attr('title', 'Sort descending')
        .html(`<i class="sort fa fa-sort-amount-asc fa-fw" aria-hidden="true"></i><span class="sr-only">Sort descending</span>`);
    }
  }

  async updateMultiForms(idRanges: Range[], stratifiedRanges?) {
    const v: any = await this.data.data(); // wait first for data and then continue with removing old forms
    const domain = d3.extent(v);
    const viewPromises = idRanges.map((r) => this.data.idView(r));
    Promise.all(viewPromises).then((views) => {
      this.updateSortIcon();
      let idList: Map<number, Range> = new Map<number, Range>();
      this.multiformList.forEach((m) => {
        idList.set(m.id, m.data.range);
      });

      this.body.selectAll('.multiformList').remove();
      this.multiformList = [];
      let isUserUnagregated = [];

      views.forEach((view, id) => {
        const $multiformdivs = this.body.append('div').classed('multiformList', true);
        const $header = $multiformdivs.append('div').classed('vislist', true);
        this.body.selectAll('.multiformList')
          .on('mouseover', function () {
            d3.select(this).select('.vislist').style('display', 'block');
          })
          .on('mouseleave', function () {
            d3.select(this).select('.vislist').style('display', 'none');
          });
        const m = new TaggleMultiform(view, <HTMLElement>$multiformdivs.node(), this.multiFormParams($multiformdivs, domain));
        m.groupId = this.setGroupFlag(stratifiedRanges, idRanges[id]);

        //assign visses
        if (this.selectedAggVis) {
          VisManager.userSelectedAggregatedVisses.set(m.id, this.selectedAggVis);
        }
        if (this.selectedUnaggVis) {
          VisManager.userSelectedUnaggregatedVisses.set(m.id, this.selectedUnaggVis);
        }
        VisManager.multiformAggregationType.set(m.id, EAggregationType.UNAGGREGATED);
        this.multiformList.push(m);
        const r = (<any>m).data.range;
        let isSuccesor = Array.from(idList.keys()).some((l, index) => {
          let newRange = r.dims[0].asList();
          let originalRange = idList.get(l).dims[0].asList();
          if (newRange.toString() === originalRange.toString() || superbag(originalRange, newRange) || superbag(newRange, originalRange)) {
            VisManager.multiformAggregationType.set(m.id, VisManager.multiformAggregationType.get(l));
            isUserUnagregated[id] = VisManager.modePerGroup[index];
            return true;
          }
        });
        if (!isSuccesor || Array.from(idList.keys()).length === 0) {
          isUserUnagregated[id] = VisManager.modePerGroup[id] || EAggregationType.AUTOMATIC;
        }
      });
      if (VisManager.modePerGroup.length !== isUserUnagregated.length) {
        VisManager.modePerGroup = isUserUnagregated;
      }
      Array.from(idList.keys()).forEach((l) => {
        VisManager.multiformAggregationType.delete(l);
        VisManager.removeUserVisses(l);
      });
    });
  }


}

export default AVectorColumn;
