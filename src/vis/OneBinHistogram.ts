/**
 * Created by Martin Ennemoser on 23.05.2017.
 */


import {ITransform} from 'phovea_core/src/vis';
import Histogram, {IHistogramOptions} from 'phovea_vis/src/distribution/Histogram';
import {IStratification} from 'phovea_core/src/stratification';
import {
  IHistAbleDataType, ICategoricalValueTypeDesc, INumberValueTypeDesc,
} from 'phovea_core/src/datatype';
import * as d3 from 'd3';
import {toSelectOperation} from 'phovea_core/src/idtype';
import {fire} from 'phovea_core/src/event';
import List from 'phovea_vis/src/list';
import Range1D from 'phovea_core/src/range/Range1D';
import Range from 'phovea_core/src/range/Range';
import {IHistogram} from 'phovea_core/src/math';

/**
 * Switches to a mosaic representation if only one bin is present
 */
export class OneBinHistogram extends Histogram {

  private isOneBin : boolean = false;
  constructor(public readonly data: IHistAbleDataType<ICategoricalValueTypeDesc|INumberValueTypeDesc>|IStratification, parent: Element, options: IHistogramOptions = {}) {
    super(data, parent, options);

  }
  protected build($svg: d3.Selection<any>) {
    this.data.hist(Math.floor(this.options.nbins)).then((hist) => {
      let nonZeroBins = 0;
      let lastNonZeroBin = -1;
      hist.forEach(function(value, index) {
        if(value > 0) {
          nonZeroBins++;
          lastNonZeroBin = index;
        }
      });

      this.isOneBin = nonZeroBins === 1;
      if(this.isOneBin) {
        console.assert(lastNonZeroBin >= 0);
        // we are using a div rather than an svg here because
        // it is easier to style
        const $parent = d3.select($svg.node().parentNode);
        $svg.remove();
        const $div = $parent.append('div');
        this.buildAsMosaic($div, lastNonZeroBin, hist);
      } else {
        super.build($svg);
      }
    });
    return $svg;
  }

  private buildAsMosaic($div : d3.Selection<any>, lastNonZeroBin : number, hist : IHistogram) {
    const onClick = (d, i) => {
      const arr = Array.apply(null, Array(d.count)).map(function (_, i) {return i;});
      const r = Range1D.from(arr);
      const r1 = new Range([r]);
      this.data.select(0, r1, toSelectOperation(<MouseEvent>d3.event));
      fire(List.EVENT_BRUSHING, [-1, -1], this.data);
    };
    this.markReady();
    const fillColor = this.data.desc.value.categories[lastNonZeroBin].color;
    const dataLength = this.data.length;
    const name = this.data.desc.value.categories[lastNonZeroBin].name;
    $div.style('background-color', fillColor)
      .style('width', `${this.size[0]}px`)
      .style('height', `${this.size[1]}px`)
      .on('click', onClick);
    $div.datum(hist);
    $div.text(name + ' ' + dataLength);
  }

  transform(scale?: [number, number], rotate?: number): ITransform {
    if(!this.isOneBin) {
      if(arguments.length === 0) {
        return super.transform();
      }
      return super.transform(scale, rotate);
    }
    const bak = {
      scale: this.options.scale || [1, 1],
      rotate: this.options.rotate || 0
    };
    if (arguments.length === 0) {
      return bak;
    }
    const size = this.rawSize;
    this.$node.attr({
      width: size[0] * scale[0],
      height: size[1] * scale[1]
    }).style('transform', 'rotate(' + rotate + 'deg)');
    const act = {scale, rotate};
    this.fire('transform', act, bak);
    this.options.scale = scale;
    this.options.rotate = rotate;
    return act;
  }
}

export default OneBinHistogram;

export function create(data: IHistAbleDataType<ICategoricalValueTypeDesc|INumberValueTypeDesc>, parent: Element, options?: IHistogramOptions) {
  return new OneBinHistogram(data, parent, options);
}

