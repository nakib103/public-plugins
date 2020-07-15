// Generated by CoffeeScript 1.12.7
(function() {
  var _score, ac_name_a, ac_name_q, ac_string_a, ac_string_q, ajax_json, boost, direct_format, direct_limit, direct_link, direct_order, direct_searches, favourite_species, favs, gi_direct, internal_site, jump_searches, jump_to, load_config, make_rate_limiter, rate_limit, score_of, sections, sort_docs, sp_fav, sp_map, sp_names;

  gi_direct = function() {
    if (Ensembl.GA) {
      return new Ensembl.GA.EventConfig({
        category: (function() {
          if (this.ui.item.link.substr(0, 13) === '/Multi/Search') {
            return 'SrchAuto';
          } else {
            return 'SrchDirect';
          }
        }),
        action: (function() {
          if ($(this.target).parents('#masthead').length) {
            return 'masthead';
          } else {
            return 'results';
          }
        }),
        label: (function() {
          return this.ui.item.link;
        }),
        nonInteraction: false
      });
    }
  };

  $.fn.getCursorPosition = function() {
    var input, sel, selLen;
    input = this.get(0);
    if (!input) {
      return;
    }
    if (input.selectionStart != null) {
      return input.selectionStart;
    } else if (document.selection) {
      input.focus();
      sel = document.selection.createRange();
      selLen = document.selection.createRange().text.length;
      sel.moveStart('character', -input.value.length);
      return sel.text.length - selLen;
    }
  };

  load_config = function() {
    var config_url;
    config_url = ($('#species_path').val()) + "/Ajax/config";
    return $.solr_config({
      url: config_url
    });
  };

  favs = void 0;

  sp_map = {};

  sp_fav = [];

  sp_names = function(name, callback) {
    if (sp_map[name] != null) {
      callback(sp_map[name], sp_fav);
      return;
    }
    return ajax_json("/Multi/Ajax/species", {
      name: name
    }, function(data) {
      var ref;
      if (data.favs != null) {
        sp_fav = data.favs;
      }
      if ((ref = data.result) != null ? ref[0] : void 0) {
        sp_map[name] = data.result[0];
        return callback(data.result[0], sp_fav);
      } else {
        return callback(void 0, sp_fav);
      }
    });
  };

  favourite_species = function(element, callback) {
    var site, skip, url_name;
    skip = false;
    if (element != null) {
      site = element.parents('form').find("input[name='site']");
      if (site.length !== 0 && site.val() !== 'ensembl' && site.val() !== 'ensembl_all' && site.val() !== 'vega') {
        skip = true;
      }
    }
    if (!skip) {
      url_name = decodeURIComponent(window.location.pathname.split('/')[1]);
      if ((url_name == null) || url_name === 'Multi') {
        url_name = '';
      }
      return sp_names(url_name, function(names, favs) {
        var s;
        if (names != null) {
          return callback([names.common]);
        } else {
          return callback((function() {
            var k, len, results;
            results = [];
            for (k = 0, len = favs.length; k < len; k++) {
              s = favs[k];
              results.push(s.common);
            }
            return results;
          })());
        }
      });
    }
  };

  ajax_json = function(url, data, success) {
    return $.ajax({
      url: url,
      data: data,
      traditional: true,
      success: success,
      dataType: 'json',
      cache: false
    });
  };

  _score = {};

  score_of = function(doc, favs) {
    var ref, score, sp;
    if (_score[doc.uid]) {
      return _score[doc.uid];
    }
    sp = $.inArray(doc.species, favs);
    sp = (sp > -1 ? favs.length - sp + 1 : 0);
    score = 200 * sp;
    score += 100 * $.inArray(doc.feature_type, direct_order);
    score += (((ref = doc.location) != null ? ref.indexOf('_') : void 0) !== -1 ? 0 : 10);
    score += (doc.database_type === 'core' ? 40 : 0);
    _score[doc.uid] = score;
    return score;
  };

  sort_docs = function(url, docs, favs, callback) {
    var d, entry, fmts, k, key, len, out, str;
    docs.sort(function(a, b) {
      return score_of(b, favs) - score_of(a, favs);
    });
    out = [];
    for (k = 0, len = docs.length; k < len; k++) {
      d = docs[k];
      fmts = direct_format[d.feature_type];
      if (fmts == null) {
        fmts = direct_format[''];
      }
      entry = {};
      for (key in fmts) {
        str = fmts[key];
        entry[key] = str.replace(/\{(.*?)\}/g, (function(m0, m1) {
          var ref, ref1;
          return (ref = (ref1 = d[m1]) != null ? ref1 : d.id) != null ? ref : 'unnamed';
        }));
      }
      entry.link = "/" + d.url;
      out.push(entry);
    }
    return callback(out);
  };

  ac_string_q = function(url, q) {
    var data, species;
    q = q.toLowerCase();
    species = window.solr_current_species();
    if (!species) {
      species = 'all';
    }
    q = species + '__' + q;
    data = {
      q: q,
      spellcheck: true
    };
    return ajax_json(url, data);
  };

  ac_string_a = function(input, output) {
    var docs, q, ref, ref1, ref2, results;
    docs = (ref = input.result) != null ? (ref1 = ref.spellcheck) != null ? (ref2 = ref1.suggestions[1]) != null ? ref2.suggestion : void 0 : void 0 : void 0;
    if (docs == null) {
      return;
    }
    results = [];
    while (docs.length) {
      q = docs.shift();
      q = q.replace(/^.*?__/, '');
      results.push(output.push({
        left: "Search for '" + q + "'",
        link: "/Multi/Search/Results?q=" + q,
        text: q
      }));
    }
    return results;
  };

  direct_order = ['Phenotype', 'Gene'];

  direct_format = {
    Phenotype: {
      left: "{name}",
      right: '{species} Phenotype'
    },
    Gene: {
      left: "{name}",
      right: "<i>{species}</i> Gene {id}"
    },
    '': {
      left: "{name}",
      right: "{id} {feature_type}"
    }
  };

  direct_link = {
    Phenotype: "{ucspecies}/Phenotype/Locations?ph={id}",
    Gene: "{ucspecies}/Gene/Summary?g={id};{rest}"
  };

  direct_searches = [
    {
      ft: ['Phenotype'],
      fields: ['name*', 'description*']
    }, {
      ft: ['Gene'],
      fields: ['name*']
    }, {
      ft: ['Sequence'],
      fields: ['id'],
      minlen: 6
    }, {
      fields: ['id'],
      minlen: 6
    }
  ];

  jump_searches = [
    {
      fields: ['id'],
      minlen: 3
    }, {
      ft: ['Gene', 'Sequence'],
      fields: ['name']
    }
  ];

  boost = function(i, n) {
    if (n > 1) {
      return Math.pow(10, (2 * (n - i - 1)) / (n - 1));
    } else {
      return 1;
    }
  };

  ac_name_q = function(config, url, query, favs) {
    return load_config().then((function(_this) {
      return function(x) {
        var cursp, data, k, l, len, len1, q, qs, s, sp, spp, spp_h;
        if (!$.solr_config('static.ui.enable_direct')) {
          return new $.Deferred().resolve();
        }
        spp = [];
        spp_h = {};
        for (k = 0, len = favs.length; k < len; k++) {
          s = favs[k];
          s = $.solr_config('spnames.%', s.toLowerCase());
          spp.push(s.toLowerCase());
          spp_h[s.toLowerCase()] = 1;
        }
        cursp = window.solr_current_species();
        if (cursp && (spp_h[cursp.toLowerCase()] == null)) {
          spp.push(cursp.toLowerCase());
        }
        qs = [];
        for (l = 0, len1 = spp.length; l < len1; l++) {
          sp = spp[l];
          sp = sp.replace(/_/g, '_-').replace(/\s+/g, '_+');
          q = query.toLowerCase().replace(/_/g, '_-').replace(/\s+/g, '_+');
          qs.push(sp + "__" + q);
        }
        q = qs.join(' ');
        data = {
          q: q,
          directlink: true,
          spellcheck: true
        };
        return ajax_json(url, data);
      };
    })(this));
  };

  direct_limit = 6;

  ac_name_a = function(input, output) {
    var d, doc, docs, i, j, k, len, p, parts, ref, ref1, ref2, results, s, species, ucspecies;
    j = 0;
    ref2 = (ref = input.result) != null ? (ref1 = ref.spellcheck) != null ? ref1.suggestions : void 0 : void 0;
    results = [];
    for (i = k = 0, len = ref2.length; k < len; i = ++k) {
      s = ref2[i];
      if (!i % 2) {
        continue;
      }
      if (j >= direct_limit) {
        break;
      }
      docs = s.suggestion;
      if (docs == null) {
        continue;
      }
      results.push((function() {
        var l, len1, len2, o, ref3, results1;
        results1 = [];
        for (l = 0, len1 = docs.length; l < len1; l++) {
          d = docs[l];
          parts = [];
          ref3 = d.split('__');
          for (o = 0, len2 = ref3.length; o < len2; o++) {
            p = ref3[o];
            parts.push(p.replace(/_\+/g, ' ').replace(/_\-?/g, '_'));
          }
          species = $.solr_config('revspnames.%', parts[0].toLowerCase());
          ucspecies = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
          doc = {
            name: parts[4],
            id: parts[3],
            species: species,
            ucspecies: ucspecies,
            rest: parts[5],
            feature_type: parts[2]
          };
          doc.url = direct_link[parts[2]];
          doc.url = doc.url.replace(/\{(.*?)\}/g, (function(m0, m1) {
            var ref4;
            return (ref4 = doc[m1]) != null ? ref4 : '';
          }));

          // check if this is ontology accession where the id will have the following format 'XXX:XXX'
          if(typeof doc.id === 'string' && doc.id.split(':').length === 2){
            doc.url = doc.url.replace(/ph=/g, 'oa=');
          }
          
          output.push(doc);
          j += 1;
          if (j >= direct_limit) {
            break;
          } else {
            results1.push(void 0);
          }
        }
        return results1;
      })());
    }
    return results;
  };

  jump_to = function(q) {
    var url;
    url = $('#se_q').parents("form").attr('action');
    if (url) {
      url = url.split('/')[1];
      if (url === 'common') {
        url = 'Multi';
      }
      url = "/" + url + "/Ajax/search";
      return favourite_species(void 0, function(favs) {
        return $.when(ac_name_q(jump_searches, url, q, favs)).done(function(id_d) {
          var direct;
          direct = [];
          ac_name_a(id_d, direct);
          if (direct.length !== 0) {
            return window.location.href = '/' + direct[0].url;
          }
        });
      });
    }
  };

  rate_limit = null;

  make_rate_limiter = function(params) {
    if (rate_limit) {
      return rate_limit(params);
    }
    return load_config().then((function(_this) {
      return function(x) {
        var limits;
        limits = $.solr_config('static.ui.direct_pause');
        rate_limit = window.rate_limiter(limits[0], limits[1]);
        return rate_limit(params);
      };
    })(this));
  };

  internal_site = function(el) {
    var site;
    site = el.parents('form').find("input[name='site']").val();
    if (site) {
      return site === 'ensembl' || site === 'ensembl_all' || site === 'vega';
    } else {
      return true;
    }
  };

  sections = [
    {
      type: 'search',
      label: ''
    }, {
      type: 'direct',
      label: 'Direct Links'
    }
  ];

  $.widget('custom.searchac', $.ui.autocomplete, {
    _create: function() {
      var $b, box, d, eh, ew, ghost, k, l, len, len1, len2, len3, o, oldval, p, pos, r, ref, ref1, ref2, ref3, t, tr_gif;
      $b = $('body');
      if ($b.hasClass('ie67') || $b.hasClass('ie8') || $b.hasClass('ie9') || $b.hasClass('ie10')) {
        this.element.clone().addClass('solr_ghost').css('display', 'none').insertAfter(this.element);
        $.ui.autocomplete.prototype._create.call(this);
        return;
      }
      tr_gif = "url(data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==)";
      eh = this.element.height();
      ew = this.element.width();
      box = $('<div></div>').css({
        position: 'relative',
        display: 'inline-block',
        'vertical-align': 'bottom'
      }).width(ew).height(eh);
      ref = ['left', 'right', 'top', 'bottom'];
      for (k = 0, len = ref.length; k < len; k++) {
        d = ref[k];
        ref1 = ['margin', 'padding'];
        for (l = 0, len1 = ref1.length; l < len1; l++) {
          p = ref1[l];
          box.css(p + "-" + d, this.element.css(p + "-" + d));
        }
        ref2 = ['style', 'color', 'width'];
        for (o = 0, len2 = ref2.length; o < len2; o++) {
          t = ref2[o];
          box.css("border-" + d + "-" + t, this.element.css("border-" + d + "-" + t));
        }
      }
      ref3 = ['background-color'];
      for (r = 0, len3 = ref3.length; r < len3; r++) {
        p = ref3[r];
        box.css(p, this.element.css(p));
      }
      box.insertAfter(this.element);
      this.element.css('background-image', tr_gif).css('padding', 0).css('margin', 0).appendTo(box).css('border', 'none').css('outline', 'none').css('background-color', 'transparent');
      this.element.css({
        'z-index': 2,
        position: 'absolute'
      });
      pos = this.element.position();
      ghost = this.element.clone().css({
        'left': pos.left + "px",
        'top': pos.top + "px"
      }).css({
        position: 'absolute',
        'z-index': 1
      }).css({
        background: 'none'
      }).val('').addClass('solr_ghost').attr('placeholder', '').attr('id', '').attr('tabindex', '5000').insertBefore(this.element).attr('name', '');
      $.ui.autocomplete.prototype._create.call(this);
      oldval = this.element.val();
      this.element.on('change keypress paste focus textInput input', (function(_this) {
        return function(e) {
          var val;
          val = _this.element.val();
          if (val !== oldval) {
            if (ghost.val().substring(0, val.length) !== val) {
              ghost.val('');
            }
            return oldval = val;
          }
        };
      })(this));
      return this.element.on('keydown', (function(_this) {
        return function(e) {
          var gval, val;
          if (e.keyCode === 39) {
            val = _this.element.val();
            gval = ghost.val();
            if (gval && gval.substring(0, val.length) === val && _this.element.getCursorPosition() === val.length) {
              return _this.element.val(gval);
            }
          }
        };
      })(this));
    },
    _renderMenu: function(ul, items) {
      var i, k, len, results, rows, s;
      results = [];
      for (k = 0, len = sections.length; k < len; k++) {
        s = sections[k];
        rows = (function() {
          var l, len1, results1;
          results1 = [];
          for (l = 0, len1 = items.length; l < len1; l++) {
            i = items[l];
            if (i.type === s.type) {
              results1.push(i);
            }
          }
          return results1;
        })();
        if (s.label && rows.length) {
          ul.append("<li class='search-ac-cat'>" + s.label + "</li>");
        }
        results.push($.each(rows, ((function(_this) {
          return function(i, item) {
            return _this._renderItemData(ul, item);
          };
        })(this))));
      }
      return results;
    },
    _renderItem: function(ul, item) {
      var $a;
      $a = $("<a class=\"search-ac\"></a>").html(item.left);
      if (item.right) {
        $a.append($('<em></em>').append(item.right));
      }
      return $("<li>").append($a).appendTo(ul);
    },
    options: {
      source: function(request, response) {
        if (internal_site(this.element)) {
          return make_rate_limiter({
            q: request.term,
            response: response,
            element: this.element
          }).done((function(_this) {
            return function(data) {
              var q, url;
              url = $('#se_q').parents("form").attr('action');
              if (url) {
                url = url.split('/')[1];
                if (url === 'common') {
                  url = 'Multi';
                }
                url = "/" + url + "/Ajax/search";
                q = data.q;
                return favourite_species(data.element, function(favs) {
                  return $.when(ac_string_q(url, q), ac_name_q(direct_searches, url, q, favs)).done(function(string_d, id_d) {
                    var direct, out, searches;
                    searches = [];
                    direct = [];
                    out = [];
                    ac_string_a(string_d[0], searches);
                    if (id_d != null ? id_d[0] : void 0) {
                      ac_name_a(id_d[0], direct);
                    }
                    return sort_docs(url, direct, favs, function(sorted) {
                      var d, k, l, len, len1, s;
                      direct = sorted;
                      for (k = 0, len = searches.length; k < len; k++) {
                        s = searches[k];
                        s.type = 'search';
                      }
                      for (l = 0, len1 = direct.length; l < len1; l++) {
                        d = direct[l];
                        d.type = 'direct';
                      }
                      out = searches.concat(direct);
                      return data.response(out);
                    });
                  });
                });
              }
            };
          })(this));
        } else {
          return response([]);
        }
      },
      select: function(e, ui) {
        var ga_direct;
        if (window.hub && window.hub.code_select) {
          if (ui.item.text) {
            $(e.target).val(ui.item.text);
            ga_direct = gi_direct();
            if (Ensembl.GA && ga_direct) {
              Ensembl.GA.sendEvent(ga_direct, {
                target: e.target,
                ui: ui
              });
            }
            window.hub.update_url({
              q: ui.item.text
            });
            return false;
          } else if (ui.item.link) {
            window.hub.spin_up();
          }
        }
        if (ui.item.link) {
          ga_direct = gi_direct();
          if (Ensembl.GA && ga_direct) {
            Ensembl.GA.sendEvent(ga_direct, {
              target: e.target,
              ui: ui
            });
          }
          return window.location.href = ui.item.link;
        }
      },
      focus: function(e, ui) {
        var ghost, ref, val;
        ghost = $(e.target).parent().find('input.solr_ghost');
        val = $(e.target).val();
        if (((ref = ui.item.text) != null ? ref : '').substring(0, val.length) === val) {
          ghost.val(ui.item.text);
          ghost.css('font-style', $(e.target).css('font-style'));
        } else {
          ghost.val('');
        }
        return false;
      },
      close: function(e, ui) {
        var ghost;
        ghost = $(e.target).parent().find('input.solr_ghost');
        return ghost.val('');
      }
    }
  });

  $(function() {
    var form, url;
    form = $('#SpeciesSearch .search-form');
    if (!form.hasClass('no-sel')) {
      url = $('#q', form).parents("form").attr('action');
      if (url) {
        url = url.split('/')[1];
        return $.solr_config({
          url: "/" + url + "/Ajax/config"
        }).done(function() {
          var ids, k, len, m, ref, ref1, ref2, selbox, text;
          selbox = $('#q', form).parent();
          ids = [];
          text = [];
          ref = $.solr_config('static.ui.facets.key=.members', 'feature_type');
          for (k = 0, len = ref.length; k < len; k++) {
            m = ref[k];
            text.push((ref1 = (ref2 = m.text) != null ? ref2.plural : void 0) != null ? ref1 : m.key);
            ids.push(m.key);
          }
          ids.unshift("");
          text.unshift("Search all categories");
          return selbox.selbox({
            action: function(id, text) {
              return selbox.selbox("maintext", text);
            },
            selchange: function() {
              return this.centered({
                max: 14,
                inc: 1
              });
            },
            field: "facet_feature_type"
          }).selbox("activate", "", text, ids).selbox("select", "");
        });
      }
    }
  });

  window.sp_names = sp_names;

  window.solr_jump_to = jump_to;

}).call(this);
