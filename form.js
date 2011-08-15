/**
 * ACCESSIBLE Form Framework
 * Easy-to-build accessible and user-friendly webforms
 * 
 * Demo: http://www.wienfluss.net/form-framework
 *
 * Copyright (c) 2011 WIENFLUSS information.design.solutions KG
 * For contributions take a look @ humans.txt
 * 
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * or GPL v3 (GPL-LICENSE.txt) licenses.
 * 
 * 2011-08-15: Forked by @yatil from: http://code.google.com/p/wienfluss-form-framework to add basic HTML5 features
 */


// self executing function to avoid global namespace conflicts
(function($) {

  /*
  ** A wrapper for attaching the jQuery UI autocomplete feature
  ** Settings:
  ** * source (required): the data sourc: either an array, or string (=URL) (none)
  ** * delay: time in ms to wait after keystroke to set the query (0)
  ** * minLength: minimal number of characters to start query (0)
  */
  $.fn.autosuggest = function(settings) {
    var o = $.extend({
      delay: 0,
      minLength: 0
    }, settings);
    
    return this.each(function() {
      var input = $(this);
      input.autocomplete({
        source: o.source,
        delay: o.delay,
        minLength: o.minLength
      });
      // open the autocomplete on focus when minLength:0
      if ( o.minLength == 0 ) {
        input.focus(function() { 
          if ( input.val() == '' ) input.autocomplete('search', '');
        });
      }
    });
  };
  
  /*
  **  Form Enhancement
  **  add aria-required
  **  add form validation (inclucding aria-invalid) based on class names
  **  Settings: ( see right below for defaults )
  **    * FIELD_SELECTORS: Selector for input fields which to consider for all features ( errors, tooltips, datepickers, ... )
  **    * VALIDATION_SELECTORS: Selector for all fields which to consider for validation
  **    * BUBBLE_DELAY: Time in [ms] for how long error bubble is visible
  **    * RULES: Set of validation rules, each consisting of a message and validation function. Triggered through classnames that are the same as thr rule name.
  */
  
$.fn.enhanceForm = function(settings) {
var o = $.extend({
    FIELD_SELECTORS: 'input:text, input:password, input:file, input:radio, input:checkbox, textarea, select, fieldset.optiongroup',
    VALIDATION_SELECTORS: 'input:text, input:password, input:file, input:checkbox, textarea, fieldset.optiongroup',
    BUBBLE_DELAY: 4000,
    RULES: {
        'required': {
            message: 'Pflichtfeld',
            isValid: function(val) {
                return val.length;
            }
        },
        'email': {
            message: 'Keine gültige E-Mail Adresse',
            isValid: function(val) {
                return ( val =='' || val.match(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/) );
            }
        },
        'datepicker': {
            message: 'Datum ungültig',
            isValid: function(val) {
                return ( val == '' || val.match(/^[0-3]?[0-9]\.[01]?[0-9]\.[12][90][0-9][0-9]$/) );
            }
        },
        'time': {
            message: 'Keine gültige Zeit',
            isValid: function(val) {
                return ( val == '' || val.match(/^\d{1,2}:\d{2}$/) );
            }
        },
        'password': {
            message: 'Passwort nicht gülitg',
            isValid: function(val) {
                return ( val =='' || val.length > 5 );
            }
        },
        'passwordRepeat': {
            message: 'Passwörter stimmen nicht überein',
            isValid: function(val) { 
                var firstField = this.closest('form').find('input.password:first');
                return ( val == firstField.val() );
            }
        },
        'radiogroup' : {
            message: 'Es muss mindestens eine Option gewählt werden'  
        }
    }
}, settings) ;
    
    // HELPERS
    $.fn.extend({
      // add Errors to Error bubble
      // call on input fields
      addErrors: function() {
        return this.each(function() {
          var input = $(this),
              errors = input.data('errors'),
              bubble = input.next('.errorBubble').children('div'),
              errorsHtml = ''
          ;
          bubble.html('');
          for ( var i=errors.length; i--; ) {
            errorsHtml += '<p class="'+errors[i]+'_error" role="alert">'+o.RULES[errors[i]].message+'</p>';
          }
          $(errorsHtml).appendTo(bubble);
        });
      },
      // call on Error bubble
      hideBubble: function(withDelay) {
        return this.each(function() {
          var bubble = $(this);
          if ( withDelay ) bubble.data('timeout', setTimeout(doHide, o.BUBBLE_DELAY));
          else doHide();
          
          function doHide() {
            if ( bubble.is(':hidden') ) return;
            bubble.hide('drop', {direction: 'up'}, 100);
          }
        });
      },
      // call on Error bubble
      showBubble: function() {
        return this.each(function() {
          if ( $(this).is(':visible') ) {
            clearTimeout($(this).data('timeout'));
            return;
          } 
          $(this).show('drop', {direction: 'up'}, 100);
        });
      },
      // removes <strong> and <a> from the label and returns just the label text
      // call on input fields
      getLabeltext: function() {
        return $(this).siblings('label').clone().remove().find('strong, a').remove().end().text();
      },
      // call on input fields
      addTooltip: function() {
        return this.each(function() {
          var input = $(this);
          if (! input.attr('title') ) return;
          
          var text = input.attr('title');
          input.data('tooltip', text).attr('aria-describedby', input.attr('id')+'_tooltip');
          $('<div id="'+input.attr('id')+'_tooltip" class="tooltip" role="tooltip">'+text+'</div>').hide().insertBefore(input);
        });
      },
      // call on input fields
      showTooltip: function() {
        return this.each(function() {
          $(this).prev('.tooltip').fadeIn(200);
        });
      },
      //call on input fields
      hideTooltip: function() {
        return this.each(function() {
          $(this).prev('.tooltip').fadeOut(100);
        });
      }
    });
    
    function initErrors () {
      $(o.VALIDATION_SELECTORS).each(function() {
        var field = $(this),
            errorPs = field.next().find('p'),
            errors = []
        ;
        for ( var i=errorPs.length; i--; ) {
          errors.push($(errorPs[i]).attr('class').split('_')[0]);
        }
        if ( errors.length ) field.data('errors', errors);
      });
    }
    
    return this.each(function(i) {
      var form = $(this);
      
      initErrors();
      
      // add all tooltips
      form.find(o.FIELD_SELECTORS).filter('.tooltip').addTooltip();
      
      // add aria-required attribute  
      form.find(o.VALIDATION_SELECTORS).filter('.required').attr('aria-required', 'true');
      
      // add aria-radiogroup
      form.find(o.VALIDATION_SELECTORS).filter('.radiogroup').attr('role', 'aria-radiogroup');
      
      // init all datepickers
      if ( $.datepicker ) {
        form.find('input.datepicker').datepicker({
          onSelect: function(selectedDate) {
            $(this).trigger('validate', ['datepicker']);
          }
        })
        // set special options on bithday datepickers
        .filter('.birthday').datepicker( 'option', {
          changeMonth: true,
          changeYear: true,
          yearRange: '1900:c',
          defaultDate: '-50y'
        })
        // hide all datepickers
        .end().datepicker('widget').hide()
        ;
      }
      
      // create all context help dialogs
      var dialogs = [];
      form.find('a.help').each(function(i) {
        var trigger = $(this),
            ajaxUrl = trigger.attr('href'),
            dialogTitle, dialogContent
        ;
        
        // Get the dialog title and content via ajax
        $.ajax({
          url: ajaxUrl,
          dataType: 'json',
          success: function(data) {
            dialogTitle = data.title;
            dialogContent = data.content;
            initDialogs();
          },
          error: function() {
            trigger.remove();
          }
        });
        
        function initDialogs () {
          dialogs[i] = $('<div></div>')
          .html(dialogContent)
          .dialog({
            title: dialogTitle,
            autoOpen: false,
            open: function() {
              var dialog = $(this),
                  dialogContainer = dialog.dialog('widget'),
                  trigger_pos = trigger.offset(),
                  x = trigger_pos.left - $(document).scrollLeft() - dialogContainer.outerWidth()/2,
                  y = trigger_pos.top - $(document).scrollTop() - dialogContainer.outerHeight()
              ;
              
              dialog.dialog('option', 'position', [x,y]);
            },
            close: function() {
              trigger.focus();
            }
          });
          
          trigger.click(function() {
            var dialog = dialogs[i];
            
            if ( dialog.dialog('isOpen') ) dialog.dialog('close');
            else {
              for ( var j=dialogs.length; j--; ) {
                if ( dialogs[j].dialog('isOpen') ) dialogs[j].dialog('close');
              }
              dialog.dialog('open');
            }
            return false;
          });
        }
      });
  
      form
      /******* general validater *******/
      .bind('validate', function(event, types, isSubmit) {
        var target    = $(event.target),
            errors    = [];
        
        for ( var i=types.length; i--; ) {
                    var type = types[i];
                    if ( type == '' || o.RULES[type] === undefined ) continue;
         
                    switch( target.attr('type') ) {
                        case 'checkbox':
                            if( !target.is(':checked') ) {errors.push(type);}
                            break;
                         case 'fieldset':
                            if( target.find('input:checked').length == 0 ) { errors.push(type);}
                            break;                        
                        default:
                            // If the field is not valid add the error to our errors array
                            if (! o.RULES[type].isValid.call(target, target.val()) ) errors.push(type);    
                    }
                }
        
                if ( errors.length ) {
                    target.trigger('error', [errors, isSubmit]);
                } else {
                    target.trigger('valid');
                }
            })
      
      /******* valid *******/
      .bind('valid', function(event) {
        var target    = $(event.target),
            hadErrors = target.data('errors')
        ;
        if (! hadErrors ) return;
        
        target.next('.errorBubble').remove();
        target
          .removeAttr('aria-invalid').removeAttr('aria-labelledby')
          .removeData('errors')
        .parent().removeClass('wrong');
      })
      
      /******* error *******/
      .bind('error', function(event, errors, isSubmit) {
        var target    = $(event.target),
            target_id = target.attr('id'),
            hadErrors = target.data('errors'),
            errorBubble = target.next('.errorBubble')
        ;
        if (! hadErrors ) {
          if ( target.is('textarea') ) target.parent().addClass('textarea');
          
          target.attr({'aria-invalid': 'true', 'aria-labelledby': target_id+'_error'})
          .parent().addClass('wrong')
          ;
          errorBubble = $('<div class="errorBubble" id="'+target_id+'_error"><div></div></div>')
            .hide()
            .insertAfter(target)
          ;
          
          if( target.is('fieldset') ) {errorBubble.addClass('errorBubbleFieldset');}
          if( target.is('input:checkbox') ) {errorBubble.addClass('errorBubbleCheckbox');}
          
        } else if ( errors.equals(hadErrors) && !isSubmit ) {
           errorBubble.hideBubble();
           return;
        }
        
        target.data('errors', errors).addErrors();
        errorBubble
          .showBubble()
          .hideBubble(true);
      })
      
      /******* create, delete or update the Error Summary *******/
      .bind('errorSummary', function(event, valid) {
        var form = $(this),
            summary = form.find('div.errorSummary'),
            hasSummary = summary.length,
            summaryOnBottom = hasSummary && summary.next('div.submit').length,
            validationFields = $(this).find(o.VALIDATION_SELECTORS)
        ;
        if ( valid ) {
          if ( hasSummary ) summary.remove();
          return;
        }
        
        if (! summaryOnBottom ) {
          summary.slideUp(300, function() {$(this).remove();});
          var summary = $('<div class="errorSummary"><div><h2>Fehler! <span>Folgende Fehler sind beim ausfüllen aufgetreten:</span></h2><ul></ul></div></div>')
              .insertBefore(form.find('div.submit'))
              .fadeTo(0,0).hide()
          ;
        }
        var list = summary.find('ul').html(''),
            itemsHtml = ''
        ;
        for ( var i=0,len=validationFields.length; i<len; i++ ) {
          var inputfield = $(validationFields[i]),
              errors = inputfield.data('errors')
          ;
          
          if (! errors ) continue;
          
          for ( var j=errors.length; j--; ) {
            switch( inputfield.get(0).tagName ) {
                case 'FIELDSET': 
                        var legendtext = inputfield.find('legend').find('strong, a').remove().end().text(),
                            errortext = o.RULES['radiogroup'].message,
                            first_radio_id = inputfield.find('input:radio:first').attr('id');
                        itemsHtml += '<li><a href="#'+first_radio_id+'">'+legendtext+': '+errortext+'</a></li>';
                    break;
                default : itemsHtml += '<li><a href="#'+inputfield.attr('id')+'">'+inputfield.getLabeltext()+': '+o.RULES[errors[j]].message+'</a></li>';
            }
          }
        }
        $(itemsHtml).appendTo(list);
        
        // focus field on click
        list.click(function(event) {
          var target = $(event.target);
          if ( target.is('a') ) $('#'+target.attr('href').split('#')[1]).focus();
          return false;
        });
        
        if (! summaryOnBottom ) summary.slideDown(300).fadeTo(300,1);
      });
      
      // ------------------------------------ //
      // Now let's react to the users inputs  //
      // ------------------------------------ //
      form
      
      /******** on focus of the fields ********/
      .focusin(function(event) { 
        var target = $(event.target);
        if ( target.is(o.FIELD_SELECTORS) || target.is('a.help') ) target.closest('.field').addClass('fieldFocused')
                                                                  .closest('.section').addClass('sectionFocused')
                                                                  .closest('form').addClass('isFocused');
        
        // if we have a tooltip show it
        if ( target.data('tooltip') ) target.showTooltip();
        
        // if we have errors show the errorBubble
        if ( target.data('errors') ) target.next('.errorBubble').showBubble();
      })
      
      /******** on blur of the fields ********/
      .focusout(function(event) {
        var target = $(event.target);
        if ( target.is(o.FIELD_SELECTORS) || target.is('a.help') ) target.closest('.field').removeClass('fieldFocused')
                                                                  .closest('.section').removeClass('sectionFocused')
                                                                  .closest('form').removeClass('isFocused');
        if (! target.is(o.VALIDATION_SELECTORS) ) return;
        if (! target.attr('class').length ) return;
        
        // if we have a tooltip hide it
        if ( target.data('tooltip') ) target.hideTooltip();
        
        var classes = target.attr('class').split(' ');
        target.trigger('validate', [classes]);
      })
      
      /******** on submit of the form ********/
      .submit(function(event) {
        var validationFields = $(this).find(o.VALIDATION_SELECTORS),
            valid = true
        ;
        
        validationFields.each(function() {
          if (! $(this).attr("class").length ) return true;
  
          var classes = $(this).attr('class').split(' '),
              returned = $(this).trigger('validate', [classes, true])
          ;
          
          if ( returned.data('errors') ) valid = false;
        });
        
        $(this).trigger('errorSummary', valid);
        
        if ( valid ) {
          if ( o.ajaxSubmit ) $(this).trigger(o.ajaxSubmit);
          else return true;
        }
        
        return false;
      })
      
      $(window).unload(function() {
        form.unbind();
      });
    });
  };
  
  // Array Helper
  // compares if two array are equal
  Array.prototype.equals = function(arr) {
    if (! arr ) return false;
    if (this.length != arr.length) return false;
    for (var i=arr.length; i--; ) {
        if (this[i].compare) { 
            if (!this[i].compare(arr[i])) return false;
        }
        if (this[i] !== arr[i]) return false;
    }
    return true;
  };
})(jQuery);
