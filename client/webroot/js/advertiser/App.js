(function (y4) {
	//"use strict";

	y4.App = Backbone.View.extend({
		className: "app",
		links: [
			{ title: "Home", hash: "" },
			{ title: "Adverts", hash: "adverts"  },
			{ title: "Campaigns", hash: "campaigns"  }
		],
		initialize: function () {
			this.router = new Router({ app: this });
			this.adverts = new y4.Adverts();
			this.campaigns = new y4.Campaigns(undefined, { adverts: this.adverts });
		},
		goAdverts: function () {
			var that = this,
				view = new y4.pages.AdvertList({ collection: this.adverts, app: this });
			view.on("select", function (id) {
				that.router.navigate("adverts/" + id, { trigger: true });
			}).on("create", function () {
				that.router.navigate("adverts/new", { trigger: true })
			});
			return this.render(view);
		},
		goAdvert: function (id) {
			var that = this,
				advert = id === "new" ? new y4.Advert() : this.adverts.get(id),
				view = advert ?
					new y4.pages.AdvertFull({ advert: advert, app: this }) :
					new y4.pages.NotFound({ message: "Advert not found." });
			view.on("return", function () {
				that.router.navigate("adverts", { trigger: true });
			});
			return this.render(view);
		},
		goCampaigns: function () {
			var that = this,
				view = new y4.pages.CampaignList({ collection: this.campaigns, app: this });
			view.on("select", function (id) {
				that.router.navigate("campaigns/" + id, { trigger: true })
			}).on("create", function () {
				that.router.navigate("campaigns/new", { trigger: true })
			});
			return this.render(view);
		},
		goCampaign: function (id) {
			var that = this,
				campaign = id === "new" ? new y4.Campaign() : this.campaigns.get(id),
				view = campaign ?
					new y4.pages.CampaignFull({ campaign: campaign, app: this }) :
					new y4.pages.NotFound({ message: "Campaign not found." });
			view.on("return", function () {
				that.router.navigate("campaigns", { trigger: true });
			});
			return this.render(view);
		},
		home: function () {
			return this.render(new y4.pages.Home({ app: this }));
		},
		render: function (page) {
			var that = this,
				currHash = window.location.hash.substr(1),
				links = _.map(this.links, function (_link) {
					var link = _.clone(_link);
					if (link.hash === currHash || (link.hash.length > 0 && currHash.indexOf(link.hash) === 0)) {
						link.active = true;
					}
					return link;
				}),
				breadcrumb = _.chain(currHash.split("/")).map(function (part) {
					var link = _.where(links, { hash: part });
					return (!link.length || link[0].hash === "") ? null : link[0];
				}).reject(function (link) {
					return link === null;
				}).value();

			breadcrumb.unshift(_.where(links, { hash: "" })[0]);
			this.$el.html(y4.templates.main({
				title: page.title,
				links: links,
				breadcrumb: breadcrumb,
				sublinks: page.sublinks
			})).find(".main-body").append(page.render().el);
			window.title = "Your 4 - " + page.title;

			page.on("change", function () {
				that.render(page);
			}).on("title", function (title) {
				that.$(".title").html("Your 4 - " + title);
				window.title = title;
			});

			if (this.page) {
				this.page.close();
			}
			this.page = page;
			return this;
		},
		start: function () {
			var that = this;
			$.when(this.adverts.fetch(), that.campaigns.fetch()).done(function () {
				Backbone.history.start();
			}).fail(function () {
				that.$el.html('<div class="alert alert-error" style="width: 700px; margin: 40px auto;"><b>Error while loading page.</b></div>')
			});
			return this;
		}
	});

	var Router = Backbone.Router.extend({
		routes: {
			"": "home",
			"adverts": "adverts",
			"adverts/:id": "advert",
			"campaigns": "campaigns",
			"campaigns/:id": "campaign",
			"*notFound": "notFound" // http://stackoverflow.com/questions/11236338/is-there-a-way-to-catch-all-non-matched-routes-with-backbone
		},
		initialize: function (options) { this.app = options.app; },
		home: function () { this.app.home(); },
		adverts: function () { this.app.goAdverts(); },
		advert: function (id) { this.app.goAdvert(id); },
		campaigns: function () { this.app.goCampaigns(); },
		campaign: function (id) { this.app.goCampaign(id); },
		notFound: function () {
			this.app.render(new y4.pages.NotFound({ message: "Page not found." }));
		}

	});

}(this.y4));
(function (root) {
	//"use strict";

	y4.View = Backbone.View.extend({
		close: function () {
			this.off().remove();
		}
	})

	y4.Page = y4.View.extend({
		setTitle: function (title) {
			this.title = title;
			this.trigger("title", title);
		}
	})

	y4.pages.Home = y4.Page.extend({
		title: "Home",
		render: function () {
			this.$el.html(y4.templates.home());
			return this;
		}
	});

	y4.pages.NotFound = y4.Page.extend({
		title: "Not found",
		render: function () {
			this.$el.html(y4.templates.notfound(_.extend({ message: "Page cannot be found." }, this.options)));
			return this;
		}
	})

	y4.List = y4.View.extend({
		events: { "click .create": "create" },
		create: function () { this.trigger("create"); },
		initialize: function (options) {
			this.collection = options.collection
			this.collection.on("add", this.addItem, this)
				.on("remove", this.removeItem, this);
			this.$items = [];
		},
		render: function () {
			var that = this;
			this.$el.html(y4.templates[this.template](this.options));
			this.collection.each(function (model) {
				that.addItem(model, undefined, true);
			});
			if (this.collection.length === 0) { this.$("tr").hide(); }
			return this;
		},
		addItem: function (model, options, noAnimation) {
			var that = this,
				$item = $(y4.templates[this.itemTemplate](_.extend(model.toJSON(), options))),
				$list = this.$(".list");

			this.$("tr").show();
			if (!$list.length) { $list = this.$el; }
			this.$items[model.id] = $item;
			$list.append($item.fadeIn(noAnimation ? 0 : 200));
			$item.click(function () {
				that.trigger("select", model.id);
			}).find(".edit").click(function () {
				that.trigger("select", model.id);
			}).end().find(".delete").click(function (e) {
				if (confirm("Are you sure you wish to delete this advert?")) {
					model.destroy();
				}
				e.preventDefault();
				e.stopPropagation();
			});
			return this;
		},
		removeItem: function (model) {
			this.$items[model.id].fadeOut(200, function () {
				$(this).remove();
			});
			if (this.collection.length === 0) { this.$("tr").hide(); }
			delete this.$items[model.id];
			return this;
		}
	});

	y4.pages.AdvertList = y4.Page.extend(y4.List.prototype).extend({
		title: "Adverts",
		className: "advert-list",
		template: "advert-list",
		itemTemplate: "advert-list-item"
	});

	y4.pages.CampaignList = y4.Page.extend(y4.List.prototype).extend({
		title: "Campaigns",
		className: "campaign-list",
		template: "campaign-list",
		itemTemplate: "campaign-list-item",
		addItem: function (model) {
			return y4.List.prototype.addItem.call(this, model, {
				adverts: _.map(model.get("advert"), function (advert) {
					return this.options.app.adverts.get(advert).toJSON()
				})
			});
		}
	});

	y4.pages.AdvertFull = y4.Page.extend({
		className: "advert-full",
		events: {
			"click .cancel": "cancel",
			"click .submit": "submit"
		},
		initialize: function (options) {
			this.advert = options.advert;
			this.adverts = options.app.adverts;
			this.title = "Advert: " + this.advert.get("title");
		},
		render: function () {
			var that = this;
			this.$el.html(y4.templates["advert-full"](this.advert.toJSON()));
			setTimeout(function () { that.updatePreview(); }, 100); // Erm.. HACK

			this.$('#advert-file').fileupload({
				dataType: 'json',
				add: function (e, data) {
					data.context = $('<p/>').text('Uploading...').appendTo(document.body);
					data.submit();
				},
				done: function (e, data) {
					that.advert.set({ url: data.result.url });
					console.log(that.advert.get("url"))
					console.log({ url: data.result.url })
				},
				progressall: function (e, data) {
					var progress = parseInt(data.loaded / data.total * 100, 10);
					console.log(progress)
					$('#progress .bar').css(
						'width',
						progress + '%'
					);
				}
			});

			this.overlayEditor = ace.edit(this.$("#advert-overlay .ace-container")[0]);
			this.overlayEditor.setTheme("ace/theme/monokai");
			this.overlayEditor.getSession().setMode("ace/mode/html");

			this.overlayEditor.getSession().on('change', function () {
				that.updatePreview();
			});

			return this;
		},
		updatePreview: _.throttle(function () {
			var update = this.$("#advert-overlay-iframe")[0].contentWindow.update;
			if (update) {
				update(this.overlayEditor.getValue());
			}
		}, 500),
		submit: function (e) {
			e.preventDefault();
			var that = this,
				attributes = {
					title: this.$("#advert-title").val(),
					type: this.$("#advert-type").val(),
					overlay: this.overlayEditor.getValue()
				},
				options = {
					success: function () {
						that.$("form").html("Saved.");
					},
					error: function () {
						that.$("form").prepend("Error saving")
					}
				};
			if (this.advert.has("id")) {
				this.advert.save(attributes, options);
			} else {
				this.advert.set(attributes);
				this.adverts.create(this.advert, options);
			}
		},
		cancel: function () {
			this.trigger("return");
		}
	});


	y4.pages.CampaignFull = y4.Page.extend({
		className: "campaign-full",
		events: {
			"click .cancel": "cancel",
			"click .submit": "submit"
		},
		initialize: function (options) {
			this.campaign = options.campaign;
			this.campaigns = options.app.campaigns;
			this.title = "Campaign: " + this.campaign.get("title");
		},
		render: function () {
			var that = this;
			this.$el.html(y4.templates["campaign-full"](_.extend({
				allAdverts: this.options.app.adverts
			}, this.campaign.toJSON())));

			var map = this.locationMap = L.map(this.$("#campaign-locations .map")[0], {
				center: [54.805, -3.59],
				zoom: 5,
				scrollWheelZoom: false
			})
			L.tileLayer('http://{s}.tile.cloudmade.com/1b189a705e22441c86cdb384a5bc7837/997/256/{z}/{x}/{y}.png', {
				attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://cloudmade.com">CloudMade</a>',
				maxZoom: 18
			}).addTo(map);
			setTimeout(function () {
				that.$(".target-tabs a").eq(0).click();
				map.invalidateSize();
			});

			var drawControl = new L.Control.Draw({
				position: 'topright',
				polyline: false,
				polygon: false,
				circle: false,
				marker: false,
				rectangle: {
					shapeOptions: {
						clickable: true,
						color: "blue"
					}
				}
			});
			map.addControl(drawControl);

			var drawnItems = new L.LayerGroup(),
				mapRects = this.mapRects = [],
				selectedRectangle,
				addRectangle = function (rect) {
					drawnItems.addLayer(rect);
					mapRects.push(rect);
					rect.on("mousemove", function () {
						if (selectedRectangle) {
							selectedRectangle.setStyle({
								color: "blue",
								fillColor: "blue"
							});
						}
						rect.setStyle({
							color: "red",
							fillColor: "red"
						});
						selectedRectangle = rect;
					});
				};
			map.on('draw:rectangle-created', function (e) {
				addRectangle(e.rect);
			});
			map.addLayer(drawnItems);

			_.each(this.campaign.get("targets").boundingBoxes, function (bb) {
				console.log("J")
				var sw = new L.LatLng(bb.minLat, bb.minLong),
					ne = new L.LatLng(bb.maxLat, bb.maxLong),
					rect = L.rectangle(new L.LatLngBounds(sw, ne), { color: "blue", fillColor: "blue" });
				addRectangle(rect);
			})

			this.$(".target-tabs a").click(function (e) {
				e.preventDefault();
				$(this).tab('show');
				map.invalidateSize();
			});

			var occupations = new y4.Occupations(),
				programmes = new y4.Programmes(),
				genres = new y4.Genres();

			occupations.fetch().then(function () {
				occupations.each(function (occupation) {
					that.$("#campaign-occupations").append('<label class="checkbox"><input type="checkbox" value="' + occupation.id + '"' +
								(that.campaign.get("targets").occupations.indexOf(occupation.id) > -1 ? ' checked="true"' : "") + '>' + capitalize(occupation.get("name")) + '</label>');
				});
			});
			programmes.fetch().then(function () {
				programmes.each(function (programme) {
					that.$("#campaign-programmes").append('<label class="checkbox"><input type="checkbox" value="' + programme.id + '"' +
								(that.campaign.get("targets").programmes.indexOf(programme.id) > -1 ? ' checked="true"' : "") + '>' + capitalize(programme.get("name")) + '</label>');
				});
			});
			genres.fetch().then(function () {
				genres.each(function (genre) {
					that.$("#campaign-genres").append('<label class="checkbox"><input type="checkbox" value="' + genre.id + '"' +
								(that.campaign.get("targets").genres.indexOf(genre.id) > -1 ? ' checked="true"' : "") + '>' + capitalize(genre.get("name")) + '</label>');
				});
			});

			var agesSelected = _.reduce(this.campaign.get("targets").ageRanges, function (memo, ageRange) {
				var min = Number(ageRange.minAge),
					max = Number(ageRange.maxAge);
				_.times(max - min + 1, function (i) {
					memo.push(min + i);
				});
				return memo;
			}, []);
			var timesSelected = _.reduce(this.campaign.get("targets").times, function (memo, daytime) {
				var day = Number(daytime.dayOfWeek),
					startTime = daytime.startTime.split(":"),
					endTime = daytime.endTime.split(":");
				console.log(startTime, endTime)
				startTime = Number(startTime[0]) * 4 + Number(startTime[1]) / 15;
				endTime = Number(endTime[0]) * 4 + Number(endTime[1]) / 15;
				_.times(endTime - startTime + 1, function (i) {
					memo[day].push(startTime + i);
				});
				return memo;
			}, {0:[],1:[],2:[],3:[],4:[],5:[],6:[]}); // Really got to clean this up...

			var $bitrange = this.$("#campaign-age-ranges .bit-range"),
				$bitmarkers = this.$("#campaign-age-ranges .bit-markers"),
				ages = this.ages = {},
				mouseMode = 0;
			$(document).mouseup(function(){
				mouseMode = 0;
			});
			_.times(101, function (i) {
				ages[i] = agesSelected.indexOf(i) > -1;
				var $bitbox = $('<div class="bit-box"></div>')
					.css({ left: i + "%", zIndex: i })
					.toggleClass("selected", ages[i]);
				$bitrange.append($bitbox);

				if (i % 10 === 0) {
					var $marker = $('<div class="bit-marker">' + i + '</div>').css({ left: i + "%" });
					$bitmarkers.append($marker);
					$bitbox.addClass("marker");
				}

				$bitbox.mousedown(function () {
					mouseMode = ages[i] ? 2 : 1;
				}).mousemove(function (e) {
					if (mouseMode === 0) { return; }
					ages[i] = mouseMode === 1;
					$bitbox.toggleClass("selected", ages[i]);
					e.preventDefault();
					return false;
				});
			});

			var days = that.days = {};
			_.times(7, function (d) {
				var times = days[d] = {},
					$day = that.$("#campaign-times .day").eq(d),
					$bitrange = $day.find(".bit-range"),
					$bitmarkers = $day.find(".bit-markers");
				_.times(96, function (i) {
					times[i] = timesSelected[d].indexOf(i) > -1;
					var $bitbox = $('<div class="bit-box"></div>')
						.css({ left: (i * (100 / 96)) + "%", zIndex: i })
						.toggleClass("selected", times[i]);
					$bitrange.append($bitbox);

					if (i % 8 === 0) {
						var $marker = $('<div class="bit-marker">' + i / 4 + ':00</div>')
							.css({ left: (i * (100 / 96)) + "%" });
						$bitmarkers.append($marker);
						$bitbox.addClass("marker");
					}

					$bitbox.mousedown(function () {
						mouseMode = times[i] ? 2 : 1;
					}).mousemove(function (e) {
						if (mouseMode === 0) { return; }
						times[i] = mouseMode === 1;
						$bitbox.toggleClass("selected", times[i]);
						e.preventDefault();
						return false;
					});
				});
			});


			return this;
		},
		submit: function (e) {
			var that = this,
				attributes = {
					title: this.$("#campaign-title").val(),
					startDate: this.$("#campaign-starts").val(),
					endDate: this.$("#campaign-ends").val(),
					adverts: _.map(this.$("#campaign-advert :checked"), function (el) {
						return Number($(el).val());
					}),
					targets: {
						genders: _.map(this.$("#campaign-genders :checked"), function (el) {
							return $(el).val();
						}),
						schedules: _.map(this.$("#campaign-schedules :checked"), function (el) {
							return $(el).val();
						}),
						ageRanges: _.chain(that.ages).reduce(function (memo, v, age) {
							if (v) { memo.push(Number(age)); }
							return memo;
						}, []).sortBy(function (age) {
							return age;
						}).reduce(function (memo, age) {
							var last = memo[memo.length - 1];
							if (!last || last.maxAge !== age - 1) {
								memo.push({ minAge: age, maxAge: age });
							} else {
								last.maxAge = age;
							}
							return memo;
						}, []).value(),
						occupations: _.map(this.$("#campaign-occupations :checked"), function (el) {
							return $(el).val();
						}),
						boundingBoxes: _.map(this.mapRects, function (rect) {
							var bounds = rect.getBounds(),
								se = bounds.getSouthEast(),
								nw = bounds.getNorthWest();
							return {
								maxLat: nw.lat, // north
								maxLong: se.lng, // east
								minLat: se.lat, // south
								minLong: nw.lng // west
							};
						}),
						genres: _.map(this.$("#campaign-genres :checked"), function (el) {
							return $(el).val();
						}),
						programmes: _.map(this.$("#campaign-programmes :checked"), function (el) {
							return $(el).val();
						}),
						times: _.chain(that.days).reduce(function (memo, times, day) {
							_.each(times, function (v, i) {
								if (v) { memo.push({ day: Number(day), time: i / 4 }); }
							});
							return memo;
						}, []).sortBy(function (daytime) {
							return daytime.day * 24 + daytime.time;
						}).reduce(function (memo, daytime) {
							var day = daytime.day,
								time = daytime.time,
								last = memo[memo.length - 1];
							if (!last || last.day !== day || last.endTime !== time - 0.25) {
								memo.push({
									day: day,
									startTime: time,
									endTime: time
								});
							} else {
								last.endTime = time;
							}
							return memo;
						}, []).map(function (daytime) {
							//console.log(daytime.endTime, pad(Math.floor(daytime.endTime), 2) + ":" + pad((daytime.endTime % 1) * 60, 2) + ":00")
							return {
								dayOfWeek: daytime.day,
								startTime: pad(Math.floor(daytime.startTime), 2) + ":" + pad((daytime.startTime % 1) * 60, 2) + ":00",
								endTime: pad(Math.floor(daytime.endTime), 2) + ":" + pad((daytime.endTime % 1) * 60, 2) + ":00"
							};
						}).value()
					}
				},
				options = {
					success: function () {
						that.$(".message").show().html('<div class="alert alert-success">Saved.</div>');
						setTimeout(function () {
							that.$(".message").fadeOut();
						}, 2000);
					},
					error: function () {
						that.$(".message").show().html('<div class="alert alert-error">Error saving</div>')
						setTimeout(function () {
							that.$(".message").fadeOut();
						}, 2000);
					}
				};
			if (this.campaign.has("id")) {
				this.campaign.save(attributes, options);
			} else {
				this.campaign.set(attributes);
				this.campaigns.create(this.campaign, options);
			}
		},
		cancel: function () {
			this.trigger("return");
		}
	});



}(this))
