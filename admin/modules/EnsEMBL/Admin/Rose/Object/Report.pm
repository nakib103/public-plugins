package EnsEMBL::Admin::Rose::Object::Report;

### NAME: EnsEMBL::Admin::Rose::Object::Report
### ORM class for the report table in healthcheck 

### STATUS: Stable

use strict;
use warnings;
use base qw(EnsEMBL::ORM::Rose::Object);

## Define schema
__PACKAGE__->meta->setup(
  table       => 'report',

  columns     => [
    report_id         => {type => 'serial', primary_key => 1, not_null => 1}, 
    species           => {type => 'varchar', 'length' => '255'},
    database_type     => {type => 'varchar', 'length' => '255'},
    database_name     => {type => 'varchar', 'length' => '255'},
    testcase          => {type => 'varchar', 'length' => '255'},
    text              => {type => 'varchar', 'length' => '255'},
    team_responsible  => {type => 'varchar', 'length' => '255'},
    result            => {type => 'enum', 'values' => [qw(PROBLEM CORRECT WARNING INFO)]},
    timestamp         => {type => 'datetime'},
    created           => {type => 'datetime'},
  ],

  relationships => [
    first_session => {
      'type'        => 'many to one',
      'map_class'   => 'EnsEMBL::Admin::Rose::Object::Session',
    },
    last_session => {
      'type'        => 'many to one',
      'map_class'   => 'EnsEMBL::Admin::Rose::Object::Session',
    },
    annotation => {
      'type'        => 'one to one',
      'map_class'   => 'EnsEMBL::Admin::Rose::Object::Annotation',
      'column_map'  => {'report_id' => 'report_id'},
    },
  ],

);

sub init_db {
  ### Set up the db connection 
  EnsEMBL::ORM::Rose::DbConnection->new('healthcheck'); 
}

1;
