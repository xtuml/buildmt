
/*******************************************************************************
 *
 * Copyright (c) 2011 Oracle Corporation.
 *
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *
 *    Nikita Levyankov, Anton Kozak
 *
 *******************************************************************************/

hudsonRules["A.reset-button"] = function(e) {
    e.onclick = function() {
        new Ajax.Request(this.getAttribute("resetURL"), {
            method: 'get',
            onSuccess: function(x) {
                location.reload(true);
            },
            onFailure: function(x) {

            }
        });
        return false;
    }
    e.tabIndex = 9999; // make help link unnavigable from keyboard
    e = null; // avoid memory leak
}

function getJobUrl() {
    var url = window.location.href;
    return url.substr(0, url.lastIndexOf('/'))
}

function onCascadingProjectUpdated() {
    if (isRunAsTest)
        return;
    jQuery('select[name=cascadingProjectName]').change(function() {
        var jobUrl = getJobUrl() + '/updateCascadingProject';
        var cascadingProject = jQuery(this).val();
        new Ajax.Request(jobUrl + '?projectName=' + cascadingProject, {
            method: 'get',
            onSuccess: function(x) {
                location.reload(true);
            }
        });
    });
}

function onProjectPropertyChanged() {
    if (isRunAsTest)
        return;
    var modify = function() {
        var cascadingProperty = findCascadingProperty(this);
        if (cascadingProperty !== undefined) {
            var jobUrl = getJobUrl() + '/modifyCascadingProperty?propertyName=' + cascadingProperty;
            new Ajax.Request(jobUrl, {
                method: 'get'
            });
        }
    };

    jQuery("form[action=configSubmit] input[type=checkbox]").live('click', modify);
    jQuery("form[action=configSubmit] input[type=text]").live('change', modify);
    jQuery("form[action=configSubmit] input[type=button]").live('click', modify);
    jQuery("form[action=configSubmit] .setting-input").live('change', modify);
    jQuery("form[action=configSubmit] button").live('click', modify);
}

function findCascadingProperty(start) {
    var trStart = jQuery(start).closest("tr[ref]");
    if (trStart.length > 0) {
        if (!jQuery(trStart).closest("table").hasClass("configure")) {
            return findCascadingProperty(jQuery(trStart).parent() );
        }
        checkBox = jQuery(trStart).find("input[type=checkbox]").first();
    } else {
        trStart = jQuery(start).closest("tr[nameref]");
        var nameref = jQuery(trStart).attr("nameref");
        trStart = jQuery(trStart).siblings("[ref=" + nameref + "]");
        trStart = jQuery(trStart).last();
        if ((trStart === undefined) || (trStart.length == 0)) {
            return;
        }
        if (!jQuery(trStart).closest("table").hasClass("configure")) {
            return findCascadingProperty(jQuery(trStart).parent());
        }
        checkBox = jQuery(trStart).find("input[type=checkbox]").first();
    }
    if (checkBox !== undefined) {
         return jQuery(checkBox).attr('name');
    }
}

jQuery(document).ready(function() {
    onCascadingProjectUpdated();
    onProjectPropertyChanged();
});
