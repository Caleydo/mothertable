/**
 * Created by Samuel Gratzl on 19.01.2017.
 */

import AColumn, {EOrientation} from './AColumn';
import {INumericalMatrix} from 'phovea_core/src/matrix';
import {MultiForm, IMultiFormOptions} from 'phovea_core/src/multiform';
import {IDataType} from 'phovea_core/src/datatype';
import Range from 'phovea_core/src/range/Range';
import {list as rlist} from 'phovea_core/src/range';
import {scaleTo, NUMERICAL_COLOR_MAP, superbag} from './utils';
import {createColumn, AnyColumn, IMotherTableType} from './ColumnManager';
import * as d3 from 'd3';
import VisManager from './VisManager';
import AColumnManager from './AColumnManager';
import {AnyFilter} from '../filter/AFilter';
import {EAggregationType} from './VisManager';


export default class MatrixColumn extends AColumn<number, INumericalMatrix> {
  minWidth: number = 150;
  maxWidth: number = 300;
  minHeight: number = 2;
  maxHeight: number = 25;

  private rowRanges: Range[] = [];
  private colRange: Range;
  dataView: IDataType;
  multiformList = [];

  private $colStrat:d3.Selection<any>;
  private colStratManager:AColumnManager = new AColumnManager();

  constructor(data: INumericalMatrix, orientation: EOrientation, $columnParent: d3.Selection<any>) {
    super(data, orientation);
    this.dataView = data;
    this.calculateDefaultRange();
    this.$node = this.build($columnParent);
  }

  protected build($parent: d3.Selection<any>): d3.Selection<any> {
    const $node = super.build($parent);

    this.$colStrat = $node.select('aside')
      .append('ol')
      .attr('reversed', 'reversed');

    return $node;
  }

  protected multiFormParams(): IMultiFormOptions {
    return {
      initialVis: VisManager.getDefaultVis(this.data.desc.type, this.data.desc.value.type,EAggregationType.UNAGGREGATED),
      'phovea-vis-heatmap': {
        color: NUMERICAL_COLOR_MAP
      }
    };
  }

  async updateMultiForms(rowRanges?:Range[], colRange?:Range) {
    this.body.selectAll('.multiformList').remove();
    this.multiformList = [];

    let idList:Map<number, Range> = new Map<number, Range>();
      this.multiformList.forEach((m) => {
        idList.set(m.id, m.data.range);
      });

    let isUserUnagregated = [];

    if (!rowRanges) {
      rowRanges = this.rowRanges;
    }
    this.rowRanges = rowRanges;

    if (!colRange) {
      colRange = (await this.calculateDefaultRange());
    }

    let id = 0;

    for (const r of rowRanges) {
      const $multiformDivs = this.body.append('div').classed('multiformList', true);

      let rowView = await this.data.idView(r);
      rowView = (<INumericalMatrix>rowView).t;

      let colView = await rowView.idView(colRange);
      colView = (<INumericalMatrix>colView).t;

      const m = new MultiForm(colView, <HTMLElement>$multiformDivs.node(), this.multiFormParams());
      this.multiformList.push(m);

      if (this.selectedAggVis) {
        VisManager.userSelectedAggregatedVisses.set(m.id, this.selectedAggVis);
      }
      if (this.selectedUnaggVis) {
        VisManager.userSelectedUnaggregatedVisses.set(m.id, this.selectedUnaggVis);
      }
      VisManager.multiformAggregationType.set(m.id, EAggregationType.UNAGGREGATED);

      let isSuccesor = Array.from(idList.keys()).some((l,index) => {
        let newRange = r.dims[0].asList();
        let originalRange = idList[l].dims[0].asList();
        if (newRange.toString() === originalRange.toString() || superbag(originalRange, newRange) || superbag(newRange, originalRange)) {
          VisManager.multiformAggregationType.set(m.id, VisManager.multiformAggregationType.get(l));
          isUserUnagregated[id] = VisManager.modePerGroup[index];
          return true;
        }
      });
      if (!isSuccesor || Array.from(idList.keys()).length === 0) {
        isUserUnagregated[id] = VisManager.modePerGroup[id] || EAggregationType.AUTOMATIC;
      }
      id = id +1;
    }
    if (VisManager.modePerGroup.length !== isUserUnagregated.length) {
      VisManager.modePerGroup = isUserUnagregated;
    }
    Array.from(idList.keys()).forEach((l) => {
        VisManager.multiformAggregationType.delete(l);
        VisManager.removeUserVisses(l);
    });
  }

  async calculateDefaultRange() {
    if (this.colRange === undefined) {
      const indices = await this.data.ids();
      this.colRange = rlist(indices.dim(1));
    }
    return this.colRange;
  }

  /**
   *
   * @param data
   * @returns {Promise<AnyColumn>}
   */
  pushColStratData(data: IMotherTableType) {
    const col = createColumn(data, EOrientation.Vertical, this.$colStrat);
    this.colStratManager.add(col);
    return Promise.resolve(col);
  }

  /**
   *
   * @returns {Promise<void>}
   */
  async updateColStrats() {
    const rangeListMap:Map<string, Range[]> = await this.colStratManager.sort();
    //console.log(rangeListMap, this.colStratManager.columns); // see output for stratification
    //this.colStratManager.stratify(rangeListMap);
  }

  filterStratData(range: Range) {
    //this.colStratManager.filter([range]);
  }

  updateColStratsSorting(filterList: AnyFilter[]) {
    this.colStratManager.sortByFilters(filterList);
    this.updateColStrats();
    // TODO still need to update the DOM order in `this.$colStrat`
  }

}
