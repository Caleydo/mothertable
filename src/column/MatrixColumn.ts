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
import {AggMode} from './VisManager';
import AggSwitcherColumn from './AggSwitcherColumn';


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
      initialVis: VisManager.getDefaultVis(this.data.desc.type, this.data.desc.value.type, AggMode.Unaggregated),
      'phovea-vis-heatmap': {
        color: NUMERICAL_COLOR_MAP
      }
    };
  }

  async updateMultiForms(rowRanges?:Range[], colRange?:Range) {
    await this.data.data();
    let idList: {[id: string]: Range} = {};
    this.rowRanges.forEach((r, i) => {
      idList[i] = r;
    });

    if (!rowRanges) {
      rowRanges = this.rowRanges;
    }
    this.rowRanges = rowRanges;

    if (!colRange) {
      colRange = (await this.calculateDefaultRange());
    }
    const viewPromises = rowRanges.map((r) => this.data.idView(r));
    Promise.all(viewPromises).then((rowViews) => {
      const colViewPromises = rowViews.map((rowView) => {
        const rw = (<INumericalMatrix>rowView).t;
        return rw.idView(colRange);
      });
      Promise.all(colViewPromises).then((views) => {
        this.body.selectAll('.multiformList').remove();
        this.multiformList = [];
        let isUserUnagregated = [];

        views.forEach((view, id) => {
          let colView = (<INumericalMatrix>view).t;
          const $multiformDivs = this.body.append('div').classed('multiformList', true);

          const m = new MultiForm(colView, <HTMLElement>$multiformDivs.node(), this.multiFormParams());
          this.multiformList.push(m);

          if (this.selectedAggVis) {
            VisManager.userSelectedAggregatedVisses[m.id.toString()] = this.selectedAggVis;
          }
          if (this.selectedUnaggVis) {
            VisManager.userSelectedUnaggregatedVisses[m.id.toString()] = this.selectedUnaggVis;
          }
          VisManager.setMultiformAggregationType(m.id.toString(), AggMode.Unaggregated);
          const r = (<any>m).data.range;
          let isSuccesor = Object.keys(idList).some((l, index) => {
            let newRange = r.dims[0].asList();
            let originalRange = idList[l].dims[0].asList();
            if (newRange.toString() === originalRange.toString() || superbag(originalRange, newRange) || superbag(newRange, originalRange)) {
              VisManager.setMultiformAggregationType(m.id.toString(), VisManager.multiformAggregationType[l]);
              isUserUnagregated[id] = AggSwitcherColumn.modePerGroup[index];
              return true;
            }
          });
          if (!isSuccesor || Object.keys(idList).length === 0) {
            isUserUnagregated[id] = AggSwitcherColumn.modePerGroup[id] || AggMode.Automatic;
          }
        });
        if (AggSwitcherColumn.modePerGroup.length !== isUserUnagregated.length) {
          AggSwitcherColumn.modePerGroup = isUserUnagregated;
        }
        Object.keys(idList).forEach((l) => {
          delete VisManager.multiformAggregationType[l];
          VisManager.removeUserVisses(l);
        });
      });
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
