'use strict';
import React from 'react';
import PropTypes from 'prop-types';
import { get, set } from 'object-path';
import { Form, formTypes } from './';
import { isText, isNumber, isArray, arrayWithLength } from '../../utils/validate';
import t from '../../utils/strings';
import ErrorReport from '../errors/report';
const { errors } = t;

export const traverseSchema = function (schema, fn, path) {
  for (let property in schema.properties) {
    const meta = schema.properties[property];
    if (meta.type === 'object' && meta.hasOwnProperty('properties')) {
      const nextPath = path ? path + '.' + property : property;
      traverseSchema(meta, fn, nextPath);
    } else {
      fn(property, meta, schema, path);
    }
  }
};

// create a copy of an object, where the copy adheres strictly to the schema.
export const removeReadOnly = function (data, schema) {
  const readOnlyRemoved = {};
  traverseSchema(schema, function (property, meta, schemaProperty, path) {
    if (!meta.readonly) {
      const accessor = path ? path + '.' + property : property;
      set(readOnlyRemoved, accessor, get(data, accessor));
    }
  });
  return readOnlyRemoved;
};

// recursively scan a schema object and create a form config from it.
// returns a flattened representation of the schema.
export const createFormConfig = function (data, schema, include) {
  data = data || {};
  const fields = [];
  traverseSchema(schema, function (property, meta, schemaProperty, path) {
    // If a field isn't user-editable, hide it from the form
    if (meta.readonly) { return; }

    // create an object-path-ready accessor string
    const accessor = path ? path + '.' + property : property;

    // if there are included properties, only create forms for those
    if (Array.isArray(include) && include.indexOf(accessor) === -1) { return; }

    // determine the label
    const required = Array.isArray(schemaProperty.required) &&
      schemaProperty.required.indexOf(property) >= 0;

    const label = (
      <span>
        { path ? <span className='label__path'>{path + ' - '}</span> : null }
        <span className='label__name'>{meta.title || property}</span>
        { required ? <span className='label__required'> *</span> : null }
        { meta.description ? <span className='label__description'> ({meta.description})</span> : null }
      </span>
    );

    const value = get(data, accessor) || get(meta, 'default');
    const config = {
      value, label,
      schemaProperty: accessor,
      required: required
    };

    // dropdowns have type set to string, but have an enum prop.
    // use enum as the type instead of string.
    const type = Array.isArray(meta['enum']) ? 'enum'
      : meta.hasOwnProperty('patternProperties') ? 'pattern' : meta.type;
    switch (type) {
      case 'pattern':
        // pattern fields are an abstraction on arrays of objects.
        // each item in the array will be a grouped set of field inputs.

        // get the first pattern property, which should be a regex that
        // validates _key.
        const { patternProperties } = meta;
        const pattern = Object.keys(patternProperties)[0];

        // attach the schema object
        config.fieldSet = patternProperties[pattern];
        config.type = formTypes.subform;
        fields.push(config);
        break;
      case 'enum':
        // pass the enum fields as options
        config.options = meta.enum;
        fields.push(dropdown(config, property, (required && isText)));
        break;
      case 'array':
        // some array types have a minItems property
        let validate = !required ? null
          : (meta.minItems && isNaN(meta.minItems))
            ? arrayWithLength(+meta.minItems) : isArray;
        fields.push(list(config, property, validate));
        break;
      case 'string':
        fields.push(textfield(config, property, (required && isText)));
        break;
      case 'number':
        fields.push(textfield(config, property, (required && isNumber)));
        break;
      default: return;
    }
  });
  return fields;
};

function textfield (config, property, validate) {
  config.type = formTypes.text;
  config.validate = validate;
  config.error = validate && get(errors, property, errors.required);
  if (property === 'password') config.isPassword = true;
  return config;
}

function dropdown (config, property, validate) {
  config.type = formTypes.dropdown;
  config.validate = validate;
  config.error = validate && get(errors, property, errors.required);
  return config;
}

function list (config, property, validate) {
  config.type = formTypes.list;
  config.validate = validate;
  config.error = validate && get(errors, property, errors.required);
  return config;
}

export const Schema = React.createClass({
  propTypes: {
    schema: PropTypes.object,
    data: PropTypes.object,
    pk: PropTypes.string,
    onCancel: PropTypes.func,
    onSubmit: PropTypes.func,
    status: PropTypes.string,

    // if present, only include these properties
    include: PropTypes.array,
    error: PropTypes.any
  },

  getInitialState: function () {
    return { fields: null };
  },

  componentWillMount: function () {
    const { schema, data, include } = this.props;
    this.setState({ fields: createFormConfig(data, schema, include) });
  },

  componentWillReceiveProps: function (newProps) {
    const { props } = this;
    const { schema, data, include } = newProps;
    if (props.pk !== newProps.pk) {
      this.setState({ fields: createFormConfig(data, schema, include) });
    }
  },

  render: function () {
    const { fields } = this.state;
    const { error } = this.props;
    return (
      <div>
        {error ? <ErrorReport report={error} /> : null}
        <Form
          inputMeta={fields}
          submit={this.props.onSubmit}
          cancel={this.props.onCancel}
          status={this.props.status}
        />
      </div>
    );
  }
});
export default Schema;