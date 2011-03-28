package EnsEMBL::Web::Configuration::Changelog;

### NAME: EnsEMBL::Web::Configuration::Changelog
### Default node and general settings for the Changelog pages

### STATUS: Stable

### DESCRIPTION:
### A standard Configuration module. Note that by default, there are
### no CRUD nodes - these are added in the admin plugin, since most
### users won't need this functionality or wish it to be exposed on
### the web. There is however a custom display node so that non-admin
### users can view relevant entries from the changelog

use strict;

use base qw(EnsEMBL::Web::Configuration);

sub set_default_action {
  my $self = shift;
  $self->{'_data'}{'default'} = 'Summary';
}

sub short_caption { 'Changelog'; }
sub caption       { 'Changelog'; }

sub modify_page_elements {
  my $self = shift;
  my $page = $self->page;
  $page->remove_body_element('tabs');
  $page->remove_body_element('tool_buttons');
  $page->remove_body_element('summary');
}

sub populate_tree {
  my $self = shift;

  $self->create_node( 'TextSummary', '',
    [qw(text_summary EnsEMBL::Admin::Component::Changelog::TextSummary)], 
    { 'availability' => 1, 'no_menu_entry' => 1 }
  );
  $self->create_node( 'Summary', 'View summary',
    [qw(summary   EnsEMBL::Admin::Component::Changelog::Summary)],
    { 'availability' => 1 },
  );

  $self->create_dbfrontend_node({'Display' => {'filters' => ['WebAdmin'], 'no_menu_entry' => 1}});
  $self->create_dbfrontend_node({$_        => {'filters' => ['WebAdmin']}}) for qw(List Select/Edit Select/Delete);
  $self->create_dbfrontend_node({$_        => {'filters' => ['WebAdmin'], 'components' => [qw(input EnsEMBL::Admin::Component::Changelog::Input)]}}) for qw(Add Edit Preview);
  $self->create_dbfrontend_node({$_        => {'filters' => ['WebAdmin']}}) for qw(Problem Confirm Save Delete);
  
}

1;