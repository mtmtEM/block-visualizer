(function() {
  var link_style = document.createElement('link');
  link_style.setAttribute('rel', 'stylesheet');
  link_style.setAttribute('href', '/static/css/d3_tree.css');
  document.body.appendChild(link_style);
})();

const currentScript = document.currentScript;

// DATA_FILE_PATH は入力フォームから受け取り
treeJSON = d3.json(DATA_FILE_PATH).then(function (treeData) {
  var root;
  let center;
  var duration = 750;
  var i = 0;
  var allNode = 0;
  var lenLabel = 0;

  // tree のサイズ
  const viewerWidth = document.documentElement.clientWidth;
  const viewerHeight = document.documentElement.clientHeight;

  root = d3.hierarchy(treeData);
  root.x0 = viewerHeight / 2;
  root.y0 = 0;
  var tree = d3.tree()
      .size([viewerHeight / 2, viewerWidth]);

  // ノードのラベル(サンプル)
  function getlabel(d) {
    let label;
    switch (d.address) {
      case "A":
        return "A Data"
      case "B":
        return "B Data"
      case "C":
        return "C Data"
      default:
        return "NO AVAILABLE DATA";
    }
  }

  // 各ノードの配色
  function getcolor(d) {
      switch (d.data.service) {
          case "AA":
              return "firebrick";
        	case "BB":
        	    return "seagreen";
        	case "CC":
        	    return "darkblue";
        	case "DD":
        	    return "coral";
        	case "EE":
        	    return "magenta";
        	default:
        	    return "black";
    	}
  }

  // ノード数のカウント
  function countNode(parent, countNodeFn, countChildrenFn) {
    if (!parent) return;

    countNodeFn(parent);
    var children = countChildrenFn(parent);
    if (children) {
        var count = children.length;
        for (var i = 0; i < count; i++) {
            countNode(children[i], countNodeFn, countChildrenFn);
        }
    }
  }

  countNode(treeData, function(d) {
      allNode = allNode + 1;
      lenLabel = Math.max(getlabel(d).length, lenLabel);
  }, function(d) {
      return d.children && d.children.length > 0 ? d.children : null;
  });

  // tree のズーム定義
  function zoom() {
      svgGroup.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
  }

  const defaultScale = 0.5;

  var zoomListener = d3.zoom()
                      .scaleExtent([0.03, 5])
                      .on("zoom", zoomed);

  var baseSvg = d3.select("#tx-treeViwe").append("svg")
                  .attr("width", viewerWidth)
                  .attr("height", viewerHeight)
                  .attr("class", "overlay");

  let div = d3.select("#tx-treeViwe").append("div")
              .attr("class", "tooltip").style("opacity", 0);

  var zoomer = baseSvg.append("rect")
                .attr("width", viewerWidth)
                .attr("height", viewerHeight)
                .style("fill", "none")
                .style("pointer-events", "all")
                .call(zoomListener);

  var g = baseSvg.append("g");
  zoomer.call(zoomListener.transform, d3.zoomIdentity.translate(150,0));
  function zoomed() {
    g.attr("transform", d3.event.transform);
  }

  function centerNode(source) {
      t = d3.zoomTransform(zoomer.node());
      console.log(t);
      x = -source.y0;
      y = -source.x0;
      // TODO:比率が変わるとサイズも変わる？
      // x = x * t.x + viewerWidth / 2;
      // y = y * t.y + viewerHeight / 2;
      // 描画する領域の真ん中に表示するように調節
      x = x + viewerWidth / 2;
      y = y + viewerHeight / 2;
      g.transition()
        .duration(duration)
        .attr("transform", "translate(" + x + "," + y + ")scale(" + t.k + ")");
  }

  // ノードの展開
  function collapse(d) {
      if (d.children) {
          d._children = d.children;
          d._children.forEach(collapse);
          d.children = null;
      }
  }

  function expand(d) {
      if (d._children) {
          d.children = d._children;
          d.children.forEach(expand);
          d._children = null;
      }
  }

  // 子ノード
  function toggleChildren(d) {
      if (d.children) {
          d._children = d.children;
          d.children = null;
      } else if (d._children) {
          d.children = d._children;
          d._children = null;
      }
      return d;
  }

  // 親ノードクリック時に子ノード展開
  function click(d) {
      if (d3.event.defaultPrevented) return;
      d = toggleChildren(d);
      update(d);
      centerNode(d);
  }

  function update(source) {
      // tree レイアウト位置を計算
      tree(root);

      // tree レイアウトを変更
      var levelWidth = [1];
      // 子要素の数をカウント
      var childCount = function(level, n) {
          if (n.children && n.children.length > 0) {
              if (levelWidth.length <= level + 1)
                  levelWidth.push(0);
              levelWidth[level + 1] += n.children.length;
              n.children.forEach(function(d) {
                  childCount(level + 1, d);
              });
          }
      };
      childCount(0, root);
      // 1行当たりの表示間隔 35 pixels
      var newHeight = d3.max(levelWidth) * 35;
      tree = tree.size([newHeight, viewerWidth]);

      // 子、孫方向の位置設定
      root.each(function(d) { d.y = d.depth * 960; });

      // ノードデータをsvg要素に設定(ノードの更新)
      var node = g.selectAll('.node')
        .data(root.descendants(), function(d) { return d.id || (d.id = ++i); });

      // ノードの現在位置を記憶
      node.each(function(d) {
        d.x0 = d.x;
        d.y0 = (d.depth * (lenLabel * 5)); // lenLabel * 5px
      });

      // ノード enter領域の設定
      var nodeEnter = node.enter()
          .append("g")
          .attr("class", "node")
          .attr("transform", function(d) {
              return "translate(" + source.y0 + "," + source.x0 + ")";
          })
          .on("click", click)
          // mouse がノードの上に載った際に情報表示 TODO:表示内容を動的に変更する
          .on("mouseover", function(d) {
            let text = "Text Test <br/>";
            let date = "2019/12/09<br/>";
            text += "Tx Time: " + date
            div.transition()
                .duration(10) // 描画されるまでの時間
                .style("opacity", 1);
            div.html(text)
                .style("left", (d3.event.pageX + 100) + "px")
                .style("top", (d3.event.pageY + 50) + "px");
          })
          // mouse がノードの上から離れた際に表示を消す
          .on("mouseout", function(d) {
              div.transition()
                  .duration(300)
                  .style("opacity", 0);
          });

      // ノード(丸枠)の描画
      nodeEnter.append("circle")
        .attr('class', 'nodeCircle')
        .attr("r", 5)
        .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });

      // ノード(テキスト)の描画
      nodeEnter.append("text")
        .attr("x", function(d) { return d.children || d._children ? -13 : 13; })
        .attr("dy", "3")
        .attr("font-size", "200%")
        .attr("text-anchor", function(d) { return d.children || d._children ? "end" : "start"; })
        .text(function(d) { return d.data.address; })
        .style("fill-opacity", 0);

      // ノードの色を変更
      node.select("circle.nodeCircle")
          .attr("r", 6)
          .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; })
          .style("stroke", function(d) { return getcolor(d); });

      // ノード enter+update領域の設定
      var nodeUpdate = nodeEnter.merge(node);
      var duration = 500;

      nodeUpdate.transition()
        .duration(duration)
        .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });

      nodeUpdate.select("circle")
        .attr("r", 8)
        .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });

      nodeUpdate.select("text")
        .style("fill-opacity", 1)
        .style("stroke", function(d) { return getcolor(d); });

      // ノード exit領域の設定
      var nodeExit = node
        .exit()
        .transition()
        .duration(duration)
        .attr("transform", function(d) { return "translate(" + source.y + "," + source.x + ")"; })
        .remove();

      nodeExit.select("circle")
        .attr("r", 1e-6);

      nodeExit.select("text")
        .style("fill-opacity", 1e-6);

      // リンクデータをsvg要素に設定
      var link = g.selectAll(".link")
        .data(root.links(), function(d) { return d.target.id; });

      // リンク enter領域のsvg要素定義
      var linkEnter = link.enter().insert('path', "g")
          .attr("class", "link")
          .attr("d", d3.linkHorizontal()
          .x(function(d) { return source.y0; })
          .y(function(d) { return source.x0; }))
          .style("stroke", function(d) { return getcolor(d.target); });

      // リンク enter+update領域の設定
      var linkUpdate = linkEnter.merge(link);
      linkUpdate
        .transition()
        .duration(duration)
        .attr("d", d3.linkHorizontal()
          .x(function(d) { return d.y; })
          .y(function(d) { return d.x; }));

      // リンク exit領域の設定
      link.exit()
          .transition()
          .duration(duration)
          .attr("d", d3.linkHorizontal()
            .x(function(d) { return source.y; })
            .y(function(d) { return source.x; })
          )
          .remove();
  }

  // treeのスケールを変更 TODO:サイズの調整
  function rescale(newscale) {
      let scale = d3.zoomTransform(zoomer.node());
      const translate = zoomListener.translate();
      let x = translate[0] - viewerWidth / 2;
      let y = translate[1] - viewerHeight / 2;
      x /= scale.x;
      y /= scale.y;
      scale = Math.max(zoomListener.scaleExtent()[0], newscale);
      scale = Math.min(zoomListener.scaleExtent()[1], newscale);
      x *= scale;
      y *= scale;
      x += viewerWidth / 2;
      y += viewerHeight / 2;
      d3.select('g').transition()
        .duration(duration)
        .attr("transform", "translate(" + x + "," + y + ")scale(" + scale.k + ")");
  }

  collapse(root);
  toggleChildren(root);
  center = root;
  if (currentScript.hasAttribute('start')) {
    const start = currentScript.getAttribute('start');
    if (!center)
      center = root;
  }
  update(root);
  centerNode(center);
});
