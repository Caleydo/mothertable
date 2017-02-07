/**
 * Created by Samuel Gratzl on 19.01.2017.
 */

import {IDataType} from 'phovea_core/src/datatype';
import {EventHandler} from 'phovea_core/src/event';
import {Range1D} from 'phovea_core/src/range';
import * as d3 from 'd3';

abstract class AFilter<T, DATATYPE extends IDataType> extends EventHandler {
  static readonly EVENT_FILTER_CHANGED = 'filterChanged';

  abstract readonly node: HTMLElement;

  constructor(public readonly data: DATATYPE) {
    super();
  }

  get idtype() {
    return this.data.idtypes[0];
  }


  protected build(parent: HTMLElement) {

    let node;
    const idType = this.idtype.id;
    const element = document.querySelector(`.${idType}`);
    if (typeof(element) !== 'undefined' && element != null) {
      const p = document.querySelector(`.${idType}`);
      node = document.createElement('div');
      p.appendChild(node);
      node.classList.add('filter');
    } else {
      const p = parent.ownerDocument.createElement('div');
      parent.appendChild(p);
      p.classList.add(`${idType}`);
      const idTypeNode = document.createElement('div');
      parent.insertBefore(idTypeNode, parent.childNodes[0]);
      idTypeNode.classList.add('idType');
      idTypeNode.innerHTML = `${idType.toLocaleUpperCase()}`;
      node = document.createElement('div');
      p.appendChild(node);
      node.classList.add('filter');
    }

    return node;

  }

  async filter(current: Range1D) {
    return current;
  }

  protected generateTooltip(node:HTMLElement) {
    const tooltipDiv = d3.select(node).append('div')
      .attr('class', 'tooltip')
      .style('opacity', 0);
    return tooltipDiv;
  }

  protected generateLabel(node: HTMLElement, labelname) {
    const labelNode = d3.select(node).append('div').classed('filterlabel', true);
    let name = labelname;
    if (name.length > 6) {
      name = name.slice(0, 6) + '..';
    }
    const toolTip = (this.generateTooltip(node));
    const fullName = labelname;
    labelNode.text(`${name.substring(0, 1).toUpperCase() + name.substring(1)}`)
      .on('mouseover', function (d, i) {
        toolTip.transition()
          .duration(200)
          .style('opacity', 1);
        toolTip.html(`${fullName}`)
          .style('left', ((<any>d3).event.pageX) + 'px')
          .style('top', ((<any>d3).event.pageY - 10) + 'px');
      })
      .on('mouseout', function (d) {
        toolTip.transition()
          .duration(500)
          .style('opacity', 0);
      });
  }


  protected triggerFilterChanged() {
    this.fire(AFilter.EVENT_FILTER_CHANGED, this);
  }
}

export default AFilter;
