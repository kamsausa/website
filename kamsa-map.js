/* <kamsa-map> — U.S. chapter map drawn from real Natural Earth / us-atlas geometry.
   Attributes: href-base (default "Chapter.dc.html#") */
(function () {
  const D3 = {
    src: "https://unpkg.com/d3@7.9.0/dist/d3.min.js",
    integrity: "sha384-CjloA8y00+1SDAUkjs099PVfnY2KmDC2BZnws9kh8D/lX1s46w6EPhpXdqMfjK6i",
  };
  const TOPO = {
    src: "https://unpkg.com/topojson-client@3.1.0/dist/topojson-client.min.js",
    integrity: "sha384-Ukv1p/xTma6P4/2bY5KzWBw+ydSpXmhCMtyciIQVDJ1RmOxtCYNMF1uXT9T63H67",
  };
  const STATES = "https://cdn.jsdelivr.net/npm/us-atlas@3.0.1/states-10m.json";

  const loaded = {};
  function loadScript(def) {
    if (loaded[def.src]) return loaded[def.src];
    loaded[def.src] = new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = def.src;
      s.integrity = def.integrity;
      s.crossOrigin = "anonymous";
      s.onload = res;
      s.onerror = () => rej(new Error("failed to load " + def.src));
      document.head.appendChild(s);
    });
    return loaded[def.src];
  }

  const W = 1240, H = 600, MAP_W = 900, MAP_H = 560, PAD_L = 10, PAD_T = 20;
  const NAVY = "#12122b", RED = "#ff2d55", INK = "#5b5b78";

  class KamsaMap extends HTMLElement {
    connectedCallback() {
      if (this._init) return;
      this._init = true;
      this.style.display = "block";
      this._root = this.attachShadow({ mode: "open" });
      this._mount = document.createElement("div");
      this._mount.style.font = "500 12px/1.4 Archivo, system-ui, sans-serif";
      this._mount.style.letterSpacing = ".12em";
      this._mount.style.textTransform = "uppercase";
      this._mount.style.color = "#8a8785";
      this._mount.textContent = "Loading map…";
      this._root.appendChild(this._mount);
      this.render();
    }

    async render() {
      let chapters = [];
      try {
        const mod = await import("./chapters.js");
        chapters = mod.CHAPTERS;
      } catch (e) {
        chapters = window.KAMSA_CHAPTERS || [];
      }
      try {
        await Promise.all([loadScript(D3), loadScript(TOPO)]);
        const topo = await window.d3.json(STATES);
        this.draw(chapters, topo);
      } catch (err) {
        this._mount.textContent = "Map unavailable — use the chapter list below.";
        console.error(err);
      }
    }

    draw(chapters, topo) {
      const d3 = window.d3, topojson = window.topojson;
      const states = topojson.feature(topo, topo.objects.states);
      const mesh = topojson.mesh(topo, topo.objects.states, (a, b) => a !== b);
      const projection = d3.geoAlbersUsa().fitSize([MAP_W, MAP_H], states);
      const path = d3.geoPath(projection);
      const base = this.getAttribute("href-base") || "Chapter.dc.html#";

      const svg = d3
        .select(this._mount)
        .html("")
        .append("svg")
        .attr("viewBox", `0 0 ${W} ${H}`)
        .attr("role", "img")
        .attr("aria-label", "Map of KAMSA regional chapters across the United States")
        .style("width", "100%")
        .style("height", "auto")
        .style("display", "block")
        .style("overflow", "visible");

      const g = svg.append("g").attr("transform", `translate(${PAD_L},${PAD_T})`);

      g.append("g")
        .selectAll("path")
        .data(states.features)
        .join("path")
        .attr("d", path)
        .attr("fill", "#e4e6f5")
        .attr("stroke", "none");

      g.append("path")
        .attr("d", path(mesh))
        .attr("fill", "none")
        .attr("stroke", "#f6f6fb")
        .attr("stroke-width", 1.6)
        .attr("stroke-linejoin", "round");

      g.append("path")
        .attr("d", path(topojson.mesh(topo, topo.objects.states, (a, b) => a === b)))
        .attr("fill", "none")
        .attr("stroke", "#c9ccea")
        .attr("stroke-width", 1);

      const layer = g.append("g");
      const R = 6;

      chapters.forEach((c) => {
        const p = projection([c.lon, c.lat]);
        if (!p) return;
        const lab = c.label || { dx: 14, dy: 0, align: "left" };
        const lx = p[0] + lab.dx;
        const ly = p[1] + lab.dy;
        const anchor = lab.align === "right" ? "end" : lab.align === "center" ? "middle" : "start";

        const a = layer
          .append("a")
          .attr("href", base + c.slug)
          .attr("aria-label", c.name + " chapter")
          .style("cursor", "pointer");

        // connector
        const gapX = lab.align === "right" ? -R - 3 : lab.align === "center" ? 0 : R + 3;
        const endX = lx + (lab.align === "right" ? 5 : lab.align === "center" ? 0 : -5);
        const endY = ly - 4;
        a.append("path")
          .attr(
            "d",
            `M${p[0] + gapX},${p[1]} L${endX},${endY}`
          )
          .attr("stroke", "#a7abd0")
          .attr("stroke-width", 1)
          .attr("fill", "none");

        a.append("rect")
          .attr("x", p[0] - R)
          .attr("y", p[1] - R)
          .attr("width", R * 2)
          .attr("height", R * 2)
          .attr("fill", RED);

        const t = a
          .append("text")
          .attr("x", lx)
          .attr("y", ly)
          .attr("text-anchor", anchor)
          .attr("dominant-baseline", "middle")
          .attr("fill", NAVY)
          .style("font", "700 15px/1 Archivo, system-ui, sans-serif")
          .style("letter-spacing", ".06em")
          .style("text-transform", "uppercase")
          .text(c.short);

        const hit = a
          .append("rect")
          .attr("x", p[0] - 18)
          .attr("y", p[1] - 18)
          .attr("width", 36)
          .attr("height", 36)
          .attr("fill", "transparent");

        const on = () => {
          a.select("rect").attr("fill", NAVY);
          t.attr("fill", RED);
        };
        const off = () => {
          a.select("rect").attr("fill", RED);
          t.attr("fill", NAVY);
        };
        a.on("mouseenter", on).on("mouseleave", off).on("focus", on).on("blur", off);
        void hit;
      });

      // count caption, flush left under the map
      svg
        .append("text")
        .attr("x", PAD_L)
        .attr("y", H - 6)
        .attr("fill", INK)
        .style("font", "500 13px/1 Archivo, system-ui, sans-serif")
        .style("letter-spacing", ".14em")
        .style("text-transform", "uppercase")
        .text(chapters.length + " active regional chapters — select a marker");
    }
  }

  if (!customElements.get("kamsa-map")) customElements.define("kamsa-map", KamsaMap);
})();
