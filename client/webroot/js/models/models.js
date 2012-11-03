(function (y4) {
	"use strict";
	var nameComparator = function (model) { return model.get("name").replace(/^the /i, ""); };
	y4.Occupations = Backbone.Collection.extend({ url: "http://www.your4.tv/api/occupations/", comparator: nameComparator });
	y4.Programmes = Backbone.Collection.extend({ url: "http://www.your4.tv/api/programmes/", comparator: nameComparator });
	y4.Genres = Backbone.Collection.extend({ url: "http://www.your4.tv/api/genres/", comparator: nameComparator });

	y4.Advert = Backbone.Model.extend({
		defaults: { title: "", type: "", adverts: [], overlay: "" }
	});
	y4.Adverts = Backbone.Collection.extend({
		model: y4p.Advert,
		url: "http://www.your4.tv/api/adverts/"
	});
	y4.Campaign = Backbone.Model.extend({
		defaults: {
			title: "",
			startDate: 0,
			endDate: 0,
			adverts: [], // FIXME: WRONG
			targets: { // FIXME: WRONG!!!
				ageRanges: [],
				boundingBoxes: [],
				times: [],
				genres: [],
				occupations: [],
				programmes: [],
				genders: [],
				schedules: []
			}
		},
		initialize: function () {
			var that = this;
			this.targetCollections = {};
			_.each(this.get("targets"), function (targets, type) {
				that.targetCollections[type] = new y4p.CampaignTargets(targets, { /*url: that.url() + "/targets/" + type + "/"*/ });
			});
		}
	});
	y4.Campaigns = Backbone.Collection.extend({
		model: y4p.Campaign,
		url: "http://www.your4.tv/api/campaigns/"
	});

	y4.CampaignTargets = Backbone.Collection.extend({
		initialize: function (items, options) {
			this.url = options.url;
		}
	});
