/**
 * Created by Samuel Gratzl on 19.01.2017.
 */

import {IDataType} from 'phovea_core/src/datatype';
import {EventHandler} from 'phovea_core/src/event';
import Range from 'phovea_core/src/range/Range';
import * as d3 from 'd3';
import {formatAttributeName} from '../column/utils';
import {dataValueType, dataValueTypeCSSClass} from '../column/ColumnManager';
import AColumn from '../column/AColumn';

export declare type AnyFilter = AFilter<any, IDataType>;

abstract class AFilter<T, DATATYPE extends IDataType> extends EventHandler {
  static readonly EVENT_FILTER_CHANGED = 'filterChanged';
  static EVENT_REMOVE_ME = 'removeFilter';
  static EVENT_MATRIX_REMOVE = 'matrixRemove';
  abstract readonly $node: d3.Selection<any>;
  activeFilter: boolean;

  constructor(public readonly data: DATATYPE) {
    super();
    this.activeFilter = false;

  }

  get idtype() {
    return this.data.idtypes[0];
  }

  protected build($parent: d3.Selection<any>) {
    return $parent;
  }


  async filter(current: Range) {
    return current;
  }


  protected generateTooltip($node: d3.Selection<any>) {
    const tooltipDiv = $node.append('div')
      .attr('class', 'tooltip')
      .style('opacity', 0);
    return tooltipDiv;
  }

  protected addHighlight($node: d3.Selection<any>) {

    $node.on('mouseover', () => {
      this.fire(AColumn.EVENT_HIGHLIGHT_ME, this);
      this.highlightMe(true);

    });

    $node.on('mouseleave', () => {
      this.highlightMe(false);
      this.fire(AColumn.EVENT_REMOVEHIGHLIGHT_ME, this);

    });
    return $node;
  }


  public  highlightMe(isTrue: boolean) {
    this.$node.select('header').classed('highlight', isTrue);

  }


  protected generateLabel($node: d3.Selection<any>) {
    $node.select('header')
      .append('h2')
      .classed('filterlabel', true)
      .html(`<i class="${dataValueTypeCSSClass(dataValueType(this.data))}" aria-hidden="true"></i> ${formatAttributeName(this.data.desc.name)}`);
  }

  protected triggerFilterChanged() {
    this.fire(AFilter.EVENT_FILTER_CHANGED, this);
  }

  protected checkFilterApplied(fullRange: number, vectorViewRange: number) {
    return (fullRange !== vectorViewRange);
  }

  protected addTrashIcon($node: d3.Selection<any>) {
    const $trashIcon = $node.append('a')
      .attr('title', 'Remove column')
      .html(`<i class="fa fa-trash fa-fw" aria-hidden="true"></i><span class="sr-only">Remove Filter</span>`)
      .on('click', () => {
        this.fire(AFilter.EVENT_REMOVE_ME, this.data);
      });

  }


}

export default AFilter;
