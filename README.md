# backbone-formset
This is a backbone plugin designed to work with Django's formsets.

Include this file then extend FormsetView like so:

```
View.MyForm = Backbone.FormsetView.extend({})
```

Here's a real world example of its use:

```
View.ToolForm = Backbone.FormsetView.extend({
  el: "#tools",
  template: _.template($("#toolFormTemplate").html()),
  deleteButtonHTML: '<span class="glyphicon glyphicon-remove" aria-hidden="true"></span>',
  addButtonHTML: '<button type="button" class="btn btn-default">Add</button>',
  initialize: function(){
    this.formPrefix = settings.toolFormsetPrefix;
  }
});
```

In this case, I set settings.toolFormsetPrefix in the template like so:

```
var toolFormsetPrefix = "{{ tool_formset.prefix }}";
```

## Additional Options

formPrefix: prefix for your formset... usually from `{{ formset.prefix }}` in your template

dynamicClass: class used to indicate a form that has been added dynamically. default is 'dynamic-form'

addText: Text used for the add button. default is 'Add'

addButtonSelector: if you want to use your own existing add button to add a new form

addButtonHTML: HTML used for add button. default is '<button type="button">' + this.addText + '</button>'

deleteButtonHTML: HTML used for delete button. default is '<a href="#">Delete</a>'

addedCallback = callback called after form is added. default is ''


Project status:

The project was built out for a need we encountered during the development of Howchoo.com. For that reason, it may be missing features that you may wish for. Feel free to leave feedback as I plan on maintaining this project.
