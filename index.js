class KeywordData {
  constructor(data) {
    const self = this;
    this._timerange = data.timerange;
    this._keywords = data.keywords;
    this._colorScale = d3.scaleOrdinal(d3.schemeCategory20).domain(this._keywords);
    this._kw_index = {};

    const date_kw = {};
    this._date_kw = date_kw;
    $.each(data.data, function(i, d) {
      date_kw[d.date] = d;
    });

    // init kw_date
    const kw_date = [];
    this._kw_date = kw_date;
    $.each(this._keywords, function(i, kw) {
      self._kw_index[kw] = i;
      kw_date.push({
        key: self._keywords[i],
        values: [],
      });
    });
    $.each(this._date_kw, function(index, d) {
      $.each(d.values, function(i, v) {
        kw_date[i].values.push({
          date: d.date,
          value: v,
        });
      });
    });
    // init kw_date_ranking
    // init date_kw_ranking
    const kw_date_ranking = [];
    const date_kw_ranking = {};
    this._kw_date_ranking = kw_date_ranking;
    this._date_kw_ranking = date_kw_ranking;
    $.each(this._keywords, function(i, kw) {
      kw_date_ranking.push({
        key: self._keywords[i],
        values: [],
      });
    });
    $.each(this._date_kw, function(index, d) {
      const len = d.values.length;
      const indices = new Array(len);
      const indexes = new Array(len);
      for (let i = 0; i < len; ++i) indices[i] = i;
      indices.sort(function (a, b) {
        return d.values[a] > d.values[b] ? -1 : d.values[a] < d.values[b] ? 1 : 0;
      });
      const rankings = new Array(len);
      $.each(indices, function(i, v) {
        rankings[indices[i]] = i;
      });
      self._date_kw_ranking[d.date] = {
        date: d.date,
        values: rankings
      };
      let rank = 0;
      $.each(indices, function(i, v) {
        // if (i === 0) {
        //   kw_date_ranking[v].values.push({
        //     date: d.date,
        //     value: rank,
        //   });
        // } else {
        //   if (d.values[indices[i-1]] !== d.values[v]) {
        //     rank++;
        //   }
        //   kw_date_ranking[v].values.push({
        //     date: d.date,
        //     value: rank,
        //   });
        // }
        kw_date_ranking[v].values.push({
          date: d.date,
          value: i,
        });
      });

    });

    // init timeunit
    this._timeunit =  d3.timeYear;
    this._highlight_kw = null;
    this.subrange = this._timerange;
  }

  get timerange() { return this._timerange; }
  get keywords() { return this._keywords; }
  get kw_index() { return this._kw_index; }
  get date_kw() { return this._date_kw; }
  get kw_date() { return this._kw_date; }
  get colorScale() { return this._colorScale; }
  get kw_date_ranking() { return this._kw_date_ranking; }
  get date_kw_ranking() { return this._date_kw_ranking; }
  get timeunit() { return this._timeunit; }
  get subrange_sum() { return this._subrange_sum; }
  get subrange_sum_ranking() { return this._subrange_sum_ranking; }

  set cursor_date(value) {
    this._cursor_date = value;
    if (this.cursorDidUpdate) this.cursorDidUpdate();
  }
  get cursor_date() { return this._cursor_date; }

  set highlight_kw(value) {
    this._highlight_kw = value;
    if (this.highlightDidUpdate) this.highlightDidUpdate();
  }
  get highlight_kw() { return this._highlight_kw; }

  set visible_ranking_range(value) {
    this._visible_ranking_range = value;
    if (this.visibleRangeDidUpdate) this.visibleRangeDidUpdate();
  }
  get visible_ranking_range() { return this._visible_ranking_range; }

  set subrange(value) {
    this._subrange = value;
    const self = this;

    const indices = new Array(this.keywords.length);
    $.each(indices, function(i, d) {
      indices[i] = i;
    });
    this._subrange_sum = new Array(this.keywords.length);
    this._subrange_sum.fill(0);
    if (this._subrange) {
      $.each(this._date_kw, function(date, d) {
        if (date >= value[0] && date<= value[1]) {
          $.each(d.values, function(i, c) {
            self._subrange_sum[i] = self._subrange_sum[i] + c;
          });
        }
      });
    }
    indices.sort(function (a, b) {
      return self._subrange_sum[a] > self._subrange_sum[b] ? -1 : self._subrange_sum[a] < self._subrange_sum[b] ? 1 : 0;
    });
    this._subrange_sum_ranking = new Array(this.keywords.length);
    $.each(indices, function(i, v) {
      self._subrange_sum_ranking[indices[i]] = i;
    });
    console.log(this._subrange_sum_ranking);
    if (this.subrangeDidUpdate) this.subrangeDidUpdate();
  }
  get subrange() { return this._subrange; }


}

class NavigationView {
  constructor(id) {
    this.margin = {top: 20, right: 30, bottom: 30, left: 50},
    this.width = $('#'+id).width() - this.margin.left - this.margin.right,
    this.height = $('#'+id).height() - this.margin.top - this.margin.bottom,
    this.svg = d3.select("#"+id).append("g").attr(
      "transform", "translate(" + this.margin.left + "," + this.margin.top + ")");
    const self = this;
    this.brushed = function() {
      if (d3.event.sourceEvent.type === "brush") return;
      let d1 = null;
      if (d3.event.selection !== null) {
        let d0 = d3.event.selection.map(self.x.invert);
        d1 = d0.map(d3.timeYear.round);
        // If empty when rounded, use floor instead.
        if (d1[0] >= d1[1]) {
          d1[0] = d3.timeYear.floor(d0[0]);
          d1[1] = d3.timeYear.offset(d1[0]);
        }
        d3.select(this).call(d3.event.target.move, d1.map(self.x));
      }
      if (self._brushDidRefresh) {
        self._brushDidRefresh(d1);
      }
    };
    this.brushEnd = function() {
      if (d3.event.selection === null) {
        if (self._brushDidRefresh) {
          self._brushDidRefresh(null);
        }
      }
    }
  }

  set brushDidRefresh(value) {
    this._brushDidRefresh = value;
  }

  get brushDidRefresh() {
    return this._brushDidRefresh;
  }

  bindData(kwd) {
    this.kwd = kwd;
    this.update();
  }

  update() {
    this.x = d3.scaleTime()
      .domain(this.kwd.timerange.map(function(d) { return new Date(d); }))
      .rangeRound([0, this.width]);
    this.x.ticks(d3.timeYear.every(1));

    this.svg.append("g")
    .attr("class", "axis axis--grid")
    .attr("transform", "translate(0," + this.height + ")")
    .call(d3.axisBottom(this.x)
        .ticks(d3.timeYear)
        .tickSize(-this.height)
        .tickFormat(function() { return null; }));

    this.svg.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0," + this.height + ")")
        .call(d3.axisBottom(this.x)
            .ticks(d3.timeYear));
    this.svg.append("g")
      .attr("class", "brush")
      .call(d3.brushX()
          .extent([[0, 0], [this.width, this.height]])
          .on("brush", this.brushed)
          .on('end', this.brushEnd)
      );
  }
}

class LineView {
  constructor(id) {
    const self = this;
    this.svg = d3.select("#" + id),
    this.margin = {top: 20, right: 30, bottom: 30, left: 50},
    this.width = $("#" + id).width() - this.margin.left - this.margin.right,
    this.height = $("#" + id).height() - this.margin.top - this.margin.bottom,
    this.g = this.svg.append("g").attr('class', 'line-view').attr("transform",
      "translate(" + this.margin.left + "," + this.margin.top + ")");
    this.clip = this.g.append("defs").append("svg:clipPath")
      .attr("id", "clip")
      .append("svg:rect")
      .attr("id", "clip-rect")
      .attr("x", "0")
      .attr("y", "0")
      .attr("width", this.width)
      .attr("height", this.height);
    this.gCursor = this.g.append('g').attr('class', 'gCursor');
    const bg = this.gCursor.append('rect')
      .attr('width', this.width)
      .attr('height', this.height)
      .attr('opacity', 0.0);
    this.brushed = function() {
      if (d3.event.sourceEvent.type === "brush") return;
      if (d3.event.selection === null) return;
      var d0 = d3.event.selection.map(self.x.invert);
      var d1 = d0.map(function(d){
        var temp = d3.timeYear.round(d.setMonth(d.getMonth()-6));
        return temp.setMonth(temp.getMonth() + 6);
      });
      d3.select(this).call(d3.event.target.move, d1.map(self.x));
      if (self._brushDidRefresh) {
        self._brushDidRefresh([self.x(d1[0]),self.x(d1[1])]);
      }
    };
    this.brush = d3.brushX()
        .extent([[0, 0], [this.width, this.height]])
        .on("brush", this.brushed);
    this.gBrush = this.g.append("g")
      .attr("class", "brush")
      .call(this.brush);
    this.gLine = this.g.append("g").attr('class', 'gLine').attr("clip-path", "url(#clip)");
    d3.select(window).on("mousemove", mousemove);
    this.x = d3.scaleTime().range([0, this.width]),
    this.axis_x = d3.axisBottom(self.x).tickArguments([d3.timeYear.every(1)]);
    this.y = d3.scaleLinear().range([this.height, 0]),
    this.cursor = this.gCursor.append('rect')
      .attr('width', 2)
      .attr('height', this.height)
      .attr('fill', 'red')
    this.line = d3.line()
        .x(function(d) { return self.x(d.date); })
        .y(function(d) { return self.y(d.value); });
    function mousemove(d, i) {
      const coord = d3.mouse(bg.node());
      if (coord[0] >= 0 && coord[0] <= self.width && coord[1] >= 0 && coord[1] <= self.height) {
        self.cursor.attr('x', coord[0]).attr('visibility','visible');
        if (self.kwd) {
          const cd = self.x.invert(coord[0]);
          cd.setMonth(cd.getMonth() + 6);
          self.kwd.cursor_date = d3.timeYear.floor(cd).valueOf();
        }
      } else {
        self.cursor.attr('visibility','hidden');
        if (self.kwd)
          self.kwd.cursor_date = null;
      }
    };
    this.t = d3.transition().duration(300);
  }

  set brushDidRefresh(value) { this._brushDidRefresh = value; }
  get brushDidRefresh() { return this._brushDidRefresh; }

  unSelectBrush() {
    this.gBrush.call(this.brush.move, null);
  }

  renderLineView() {
    const self = this;
    const kwData = self.gLine.selectAll("g.keyword").data(self.kwd.kw_date);
    // enter
    const kwDataEnter = kwData.enter().append("g").attr("class", "keyword");
    kwDataEnter.append("path").attr("class", "line")
      .on("mouseenter", function(d, i) {
        self.kwd.highlight_kw = d.key;
        d3.select(this.parentNode).moveToFront();
      })
      .on("mouseleave", function(d, i) {
        self.kwd.highlight_kw = null;
        d3.select(this.parentNode).moveToBack();
      });
    // update and enter
    kwData.merge(kwDataEnter).selectAll('path')
      .attr("id", function(d) {
        return d.key + "_path"; })
      .attr("d", function(d) { return self.line(d.values); })
      .classed('line-highlight', function(d) {
        return (self.kwd.highlight_kw !== null) && (self.kwd.highlight_kw === d.key);
      })
      .classed('line-dim', function(d) {
        return (self.kwd.highlight_kw !== null) && (self.kwd.highlight_kw !== d.key);
      })
      .style("stroke", function(d, i) { return self.kwd.colorScale(d.key); });
    // exit
    kwData.exit().remove();
  }

  renderAxis() {
    const self = this;
    function extend(range) {
      let d1 = new Date(range[0]);
      let d2 = new Date(range[1]);
      d1.setMonth(d1.getMonth()-6);
      d2.setMonth(d2.getMonth()+6);
      return [d1.valueOf(), d2.valueOf()];
    }
    // set x-date range
    if (self.kwd.subrange) {
      self.x.domain(extend(self.kwd.subrange));
    } else {
      self.x.domain(extend(self.kwd.timerange));
    }
    // set y-count range
    self.y.domain([
      d3.min(self.kwd.kw_date, function(c) { return d3.min(c.values, function(d) { return d.value; }); }),
      d3.max(self.kwd.kw_date, function(c) { return d3.max(c.values, function(d) { return d.value; }); })
    ]);
    // render Axis x
    self.g.selectAll('.axis').remove();
    self.g.append("g")
      .attr("class", "axis axis--x")
      .attr("transform", "translate(0," + self.height + ")")
      .call(this.axis_x);
    // render Axis y and text
    self.g.append("g")
      .attr("class", "axis axis--y")
      .call(d3.axisLeft(self.y))
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", "0.71em")
      .attr("fill", "#000")
      .text("Count");
  }

  bindData(kwd) {
    this.kwd = kwd;
    this.update();
  }

  update() {
    const self = this;
    // set color scale
    // TODO: pass from outside
    self.renderAxis();
    // render Line view
    self.renderLineView();
  }

  updateVisible() {
    if (this.kwd.visible_ranking_range !== null) {
      this.dim = true;
    } else {
      this.dim = false;
    }
  }

  set dim(value) {
    const self = this;
    if (this._dim !== value) {
      if (value) {
        this.g.append('rect')
          .attr('class', 'dim')
          .attr('x', 0)
          .attr('y', 0)
          .attr('width', this.width)
          .attr('height', this.height)
          .attr('fill', 'black')
          .attr('opacity', 0.0)
          .on('click', function(){
            self.kwd.visible_ranking_range = null;
          })
          .transition(d3.transition().duration(1000))
          .attr('opacity',0.2);
      } else {
        self.unSelectBrush();
        this.g.selectAll('.dim').transition(this.t).attr('opacity', 0.0).remove();
      }
    }
    this._dim = value;
  }

  get dim() { return this._dim; }
}

class RankingView {
  constructor(id) {
    const self = this;
    this.svg = d3.select("#" + id);
    this.margin = {top: 20, right: 30, bottom: 30, left: 50};
    this.width = $("#" + id).width() - this.margin.left - this.margin.right;
    this.height = $("#" + id).height() - this.margin.top - this.margin.bottom;
    this.g = this.svg.append("g").attr('class', 'ranking-view').attr("transform",
      "translate(" + this.margin.left + "," + this.margin.top + ")");

    this.clip = this.g.append("defs").append("svg:clipPath")
      .attr("id", "clip")
      .append("svg:rect")
      .attr("id", "clip-rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", 0)
      .attr("height", this.height);

    this.gBg = this.g.append('g').attr('class', 'gBg').attr("clip-path", "url(#clip)");
    this.gBg.append('rect').attr('x', 0).attr('y', 0).attr('width', this.width)
      .attr('height', this.height).attr('fill','white');
    this.gPoints = this.g.append("g").attr('class', 'gPoints').attr("clip-path", "url(#clip)");

    this.x = d3.scaleTime().range([0, this.width]);
    this.x2 = d3.scaleBand().range([0, this.width]);
    this.y = d3.scalePoint().range([0, this.height]).padding(0.5);

    this.line = d3.line()
        .x(function(d) { return self.x(d.date); })
        .y(function(d) { return self.y(d.value); });
  }

  renderLineView() {
    const self = this;
    const gPoint = this.gPoints.selectAll("g.gPoint").data(this.kwd.kw_date_ranking);
    const gPointEnter = gPoint.enter().append('g').attr('class', "gPoint");
    gPoint.merge(gPointEnter).each(function(c, i) {
      d3.select(this).selectAll('path').remove();
      var lineFunc = d3.line()
    		.x(function (d) { return d.x; })
    		.y(function (d) { return d.y; });
      const ps = [];
      $.each(c.values, function(i, d) {
        ps.push({
          x: self.x(d.date) - self.x2.step()/4,
          y: self.y(d.value)
        });
        ps.push({
          x: self.x(d.date) + self.x2.step()/4,
          y: self.y(d.value)
        });
      });

      d3.select(this).append("path").attr('class', 'line')
        .classed('line-highlight', function(d) {
          return (self.kwd.highlight_kw !== null) && (self.kwd.highlight_kw === c.key);
        })
        .classed('line-dim', function(d) {
          return (self.kwd.highlight_kw !== null) && (self.kwd.highlight_kw !== c.key);
        })
    		.attr("d", function() { return lineFunc(ps); })
        .on("mouseenter", function(d, i) {
          self.kwd.highlight_kw = c.key;
          d3.select(this.parentNode).moveToFront();
        })
        .on("mouseleave", function(d, i) {
          self.kwd.highlight_kw = null;
          d3.select(this.parentNode).moveToBack();
        })
    		.attr("stroke", self.kwd.colorScale(c.key))
    		.attr("stroke-width", function(d) {
          if (self.x2.step() <= 35) {
            return 2;
          } else if(self.x2.step() <= 60) {
            return 3;
          } else {
            return 6;
          }
        })
    		.attr("fill", "none");
    });
    gPoint.exit().remove();
  }

  renderAxis() {
    const self = this;
    function extend(range) {
      let d1 = new Date(range[0]);
      let d2 = new Date(range[1]);
      d1.setMonth(d1.getMonth()-6);
      d2.setMonth(d2.getMonth()+6);
      return [d1.valueOf(), d2.valueOf()];
    }
    // set x-date range
    if (self.kwd.subrange) {
      self.x.domain(extend(self.kwd.subrange));
      self.x2.domain(d3.timeYears(self.kwd.subrange[0], self.kwd.subrange[1]));
    } else {
      self.x.domain(extend(self.kwd.timerange));
      self.x2.domain(d3.timeYears(self.kwd.timerange[0], self.kwd.timerange[1]));
    }
    // set y-count range
    self.y.domain(
      d3.range(
        d3.max(self.kwd.kw_date_ranking, function(d) {
          return d3.max(d.values, function(c) {
            return c.value;
          })
        }) + 1
      )
    );
  }

  bindData(kwd) {
    this.kwd = kwd;
    this.update();
  }

  update() {
    this.updateVisible();
    this.renderAxis();
    // render Line view
    this.renderLineView();
  }

  updateVisible() {
    if (this.kwd.visible_ranking_range) {
      this.clip.attr('x', this.kwd.visible_ranking_range[0]).attr('width', this.kwd.visible_ranking_range[1]);
    } else {
      this.clip.attr('x', 0).attr('width', 0);
    }
  }
}

class KeywordsView {
  constructor(id) {
    const self = this;
    this.svg = d3.select("#" + id);
    this.width = $("#" + id).width();
    this.height = $("#" + id).height();
    this.g = this.svg.append("g").attr('class', 'keywords-view');
    this.y = d3.scaleBand().range([0, this.height]).padding(1);
    this.x = d3.scaleLinear().range([0, this.width]);
  }

  update() {
    this.renderKeywords();
  }

  renderKeywords() {
    const r = 4;
    const self = this;
    let values = null;
    let rankings = null;
    if (self.kwd.cursor_date && self.kwd.date_kw[self.kwd.cursor_date]) {
      values = self.kwd.date_kw[self.kwd.cursor_date].values;
      rankings = self.kwd.date_kw_ranking[self.kwd.cursor_date].values;
    }
    if (!self.kwd.cursor_date) {
      values = self.kwd.subrange_sum;
      rankings = self.kwd.subrange_sum_ranking;
    }
    self.x.domain([0, d3.max(values)]);
    self.y.domain(d3.range(self.kwd.keywords.length));
    const gKeywords = self.g.selectAll('g.gKeyword').data(self.kwd.keywords);
	  const gKeywordsEnter = gKeywords.enter()
			.append('g').attr('class', 'gKeyword');
    gKeywordsEnter.append('rect').attr('class', 'keyword-bg');
    gKeywordsEnter.append('rect').attr('class', 'keyword-bar');
	  gKeywordsEnter.append('text').attr('class', 'keyword-label');

   	gKeywords.merge(gKeywordsEnter).selectAll('rect.keyword-bar')
      .attr('x', 0)
  	  // .attr('rx', r)
  	  // .attr('ry', r)
      .attr('height', self.y.step())
      .attr('fill', function(key) {
        return self.kwd.colorScale(key); })
      .attr('y', function(key) {
        return self.y(rankings[self.kwd.kw_index[key]]) - self.y.step(); })
      .attr('width', function(key) {
        return self.x(values[self.kwd.kw_index[key]]); });

    gKeywords.merge(gKeywordsEnter).selectAll('rect.keyword-bg')
      .attr('x', 0)
      .attr('y', function(key) { return self.y(rankings[self.kwd.kw_index[key]]) - self.y.step(); })
  	  // .attr('rx', r)
  	  // .attr('ry', r)
      .attr('width', self.width)
      .attr('height', self.y.step())
      .attr('fill', function(key) { return self.kwd.colorScale(rankings[self.kwd.kw_index[key]]); })
	    .attr('opacity', 0.2);

    gKeywords.merge(gKeywordsEnter).selectAll('text.keyword-label')
      .text(function (key) { return key + " " + values[self.kwd.kw_index[key]]; })
      .attr('x', 4)
      .attr('y', function(key) { return self.y(rankings[self.kwd.kw_index[key]]) - self.y.step()/2; })
      .attr('alignment-baseline', 'central')
	    .attr('text-anchor', 'start')
      .attr('fill','#333333');


    gKeywords.exit().remove();
  }

  bindData(kwd) {
    this.kwd = kwd;
    this.update();
  }
}

d3.selection.prototype.moveToFront = function() {
  return this.each(function(){
    this.parentNode.appendChild(this);
  });
};
d3.selection.prototype.moveToBack = function() {
    return this.each(function() {
        var firstChild = this.parentNode.firstChild;
        if (firstChild) {
            this.parentNode.insertBefore(this, firstChild);
        }
    });
};


const navView = new NavigationView('navigation-view');
const lineView = new LineView('line-view');
const rankingView = new RankingView('line-view');
const keywordsView = new KeywordsView('keywords-view');
d3.json('data.json', function(data) {
  const kwd = new KeywordData(data);
  lineView.bindData(kwd);
  rankingView.bindData(kwd);
  navView.bindData(kwd);
  keywordsView.bindData(kwd);
  kwd.subrangeDidUpdate = function() {
    rankingView.update();
    lineView.update();
  };
  kwd.visibleRangeDidUpdate = function() {
    rankingView.updateVisible();
    lineView.updateVisible();
  };
  kwd.highlightDidUpdate = function() {
    rankingView.update();
    lineView.update();
    keywordsView.update();
  };
  kwd.cursorDidUpdate = function() {
    keywordsView.update();
  };
  lineView.brushDidRefresh = function(d) {
    kwd.visible_ranking_range =[d[0],d[1]-d[0]];
  };
  navView.brushDidRefresh = function(d) {
    kwd.subrange = d;
    kwd.visible_ranking_range = null;
  };
})
