/**
 * Created by Samuel Gratzl on 25.01.2016.
 */

import {select} from 'd3';
import * as d3 from 'd3';
import {mixin} from 'phovea_core/src';
import {AVisInstance, IVisInstance, assignVis, IVisInstanceOptions} from 'phovea_core/src/vis';
import {IAnyVector} from 'phovea_core/src/vector';

export interface ILabelOptions extends IVisInstanceOptions {
  /**
   * width
   * @default 200
   */
  width?: number;

  /**
   * scale such that the height matches the argument
   * @default 100
   */
  heightTo?: number;
}

export class LabelVis extends AVisInstance implements IVisInstance {
  private readonly options: ILabelOptions = {
    width: 200,
    heightTo: 100,
    scale: [1,1],
    rotate: 0
  };


  private readonly $node: d3.Selection<LabelVis>;

  constructor(public readonly data: IAnyVector, parent: HTMLElement, options: ILabelOptions = {}) {
    super();
    mixin(this.options, options);

    this.options.scale = [options.width / this.rawSize[0] || 1, options.heightTo / this.rawSize[1] || 1];

    this.$node = this.build(select(parent));
    this.$node.datum(this);
    assignVis(this.node, this);
  }

  get rawSize(): [number, number] {
    return [200, 100];
  }

  get node() {
    return <HTMLElement>this.$node.node();
  }

  transform(scale?: [number, number], rotate: number = 0) {
    const bak = {
      scale: this.options.scale || [1, 1],
      rotate: this.options.rotate || 0
    };
    if (arguments.length === 0) {
      return bak;
    }
    this.$node.style('transform', 'rotate(' + rotate + 'deg)');
    this.$node.style('width', `${scale[0] * this.rawSize[0]}px`);


    this.$node.style('height', `${scale[1] * this.rawSize[1]}px`);

    const act = {scale, rotate};
    this.fire('transform', act, bak);
    this.options.scale = scale;
    this.options.rotate = rotate;
    return act;
  }

  private build($parent: d3.Selection<any>) {
    const size = this.size;
    const $list = $parent.append('div').attr('class', 'phovea-labelvis');
    $list.style('width', `${size[0]}px`);
    $list.style('height', `${size[1]}px`);
    $list.html(`<div>${this.data.length} ${this.data.idtype.names}</div>`);
    this.markReady();
    return $list;
  }
}

export default LabelVis;

export function create(data: IAnyVector, parent: HTMLElement, options: ILabelOptions) {
  return new LabelVis(data, parent, options);
}

