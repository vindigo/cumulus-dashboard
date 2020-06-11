'use strict';
import React from 'react';
import PropTypes from 'prop-types';
import { withRouter, Link } from 'react-router-dom';
import { connect } from 'react-redux';
import { get } from 'object-path';
import {
  listPdrs,
  clearPdrsFilter,
  filterPdrs
} from '../../actions';
import { lastUpdated, tally, displayCase } from '../../utils/format';
import { bulkActions } from '../../utils/table-config/pdrs';
import { tableColumns } from '../../utils/table-config/pdr-progress';
import List from '../Table/Table';
import Overview from '../Overview/overview';
import Dropdown from '../DropDown/dropdown';
import pageSizeOptions from '../../utils/page-size';
import ListFilters from '../ListActions/ListFilters';
import Breadcrumbs from '../Breadcrumbs/Breadcrumbs';

const breadcrumbConfig = [
  {
    label: 'Dashboard Home',
    href: '/'
  },
  {
    label: 'PDRs',
    active: true
  }
];

class PdrOverview extends React.Component {
  constructor () {
    super();
    this.generateQuery = this.generateQuery.bind(this);
    this.generateBulkActions = this.generateBulkActions.bind(this);
    this.renderOverview = this.renderOverview.bind(this);
  }

  componentDidMount () {
    this.props.onQueryChange(this.generateQuery());
  }

  generateQuery () {
    return {};
  }

  generateBulkActions () {
    return bulkActions(this.props.pdrs);
  }

  renderOverview (count) {
    const overview = count.map(d => [tally(d.count), displayCase(d.key)]);
    return <Overview items={overview} inflight={false} />;
  }

  render () {
    const { stats } = this.props;
    const { list } = this.props.pdrs;
    const { count, queriedAt } = list.meta;
    // create the overview boxes
    const pdrCount = get(stats.count, 'data.pdrs.count', []);
    const overview = this.renderOverview(pdrCount);
    return (
      <div className='page__component'>
        <section className='page__section page__section__controls'>
          <Breadcrumbs config={breadcrumbConfig} />
        </section>
        <section className='page__section page__section__header-wrapper'>
          <h1 className='heading--large heading--shared-content with-description'>PDR Overview</h1>
          {lastUpdated(queriedAt)}
          {overview}
        </section>
        <section className='page__section'>
          <div className='heading__wrapper--border'>
            <h2 className='heading--medium heading--shared-content with-description'>All PDRs <span className='num-title'>{count ? ` ${tally(count)}` : 0}</span></h2>
          </div>
          <List
            list={list}
            dispatch={this.props.dispatch}
            action={listPdrs}
            tableColumns={tableColumns}
            sortId='timestamp'
            query={this.generateQuery()}
            bulkActions={this.generateBulkActions()}
            rowId='pdrName'
          >
            <ListFilters>
              <Dropdown
                options={pageSizeOptions}
                action={filterPdrs}
                clear={clearPdrsFilter}
                paramKey={'limit'}
                label={'Results Per Page'}
              />
            </ListFilters>
          </List>
          <Link className='link--secondary link--learn-more' to='/pdrs/active'>View Currently Active PDRs</Link>
        </section>
      </div>
    );
  }
}

PdrOverview.propTypes = {
  dispatch: PropTypes.func,
  onQueryChange: PropTypes.func,
  pdrs: PropTypes.object,
  stats: PropTypes.object
};

export default withRouter(connect(state => ({
  stats: state.stats,
  pdrs: state.pdrs
}))(PdrOverview));
