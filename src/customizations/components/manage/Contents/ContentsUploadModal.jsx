/**
 * Contents upload modal.
 * @module components/manage/Contents/ContentsUploadModal
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { compose } from 'redux';
import {
  Button,
  Dimmer,
  Header,
  Icon,
  Image,
  Loader,
  Modal,
  Table,
  Segment,
} from 'semantic-ui-react';
import loadable from '@loadable/component';
import { concat, filter, map } from 'lodash';
import filesize from 'filesize';
import { readAsDataURL } from 'promise-file-reader';
import { FormattedMessage, defineMessages, injectIntl } from 'react-intl';
import { FormattedRelativeDate } from '@plone/volto/components';
import { createContent } from '@plone/volto/actions';
import { validateFileUploadSize } from '@plone/volto/helpers';
import describeImage from "../Blocks/Image/visionDescription";

const Dropzone = loadable(() => import('react-dropzone'));
const describer = new  describeImage()
const messages = defineMessages({
  cancel: {
    id: 'Cancel',
    defaultMessage: 'Cancel',
  },
  upload: {
    id: '{count, plural, one {Upload {count} file} other {Upload {count} files}}',
    defaultMessage:
      '{count, plural, one {Upload {count} file} other {Upload {count} files}}',
  },uploadingImage: {
    id: 'Uploading image',
    defaultMessage: 'Uploading files or Generating description',
  },
});

const SUBREQUEST = 'batch-upload';

/**
 * ContentsUploadModal class.
 * @class ContentsUploadModal
 * @extends Component
 */
class ContentsUploadModal extends Component {
  /**
   * Property types.
   * @property {Object} propTypes Property types.
   * @static
   */
  static propTypes = {
    createContent: PropTypes.func.isRequired,
    pathname: PropTypes.string.isRequired,
    request: PropTypes.shape({
      loading: PropTypes.bool,
      loaded: PropTypes.bool,
    }).isRequired,
    open: PropTypes.bool.isRequired,
    onOk: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
  };
  state = {
    uploading: false
  };
  /**
   * Constructor
   * @method constructor
   * @param {Object} props Component properties
   * @constructs ContentsUploadModal
   */
  constructor(props) {
    super(props);
    this.onRemoveFile = this.onRemoveFile.bind(this);
    this.onDrop = this.onDrop.bind(this);
    this.onCancel = this.onCancel.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
    this.state = {
      files: [],
    };
  }


  /**
   * Component will receive props
   * @method componentWillReceiveProps
   * @param {Object} nextProps Next properties
   * @returns {undefined}
   */
  UNSAFE_componentWillReceiveProps(nextProps) {
    if (this.props.request.loading && nextProps.request.loaded &&
      this.state.uploading ) {
      this.setState({
        uploading: false,
      });
      this.props.onOk();
      this.setState({
        files: [],
      });
    }
  }

  /**
   * Remove file handler
   * @method onRemoveFile
   * @param {Object} event Event object
   * @returns {undefined}
   */
  onRemoveFile(event) {
    this.setState({
      files: filter(
        this.state.files,
        (file, index) =>
          index !== parseInt(event.target.getAttribute('value'), 10),
      ),
    });
  }

  /**
   * Drop handler
   * @method onDrop
   * @param {array} files File objects
   * @returns {undefined}
   */
  onDrop = async (files) => {
    const validFiles = [];
    for (let i = 0; i < files.length; i++) {
      if (validateFileUploadSize(files[i], this.props.intl.formatMessage)) {
        await readAsDataURL(files[i]).then((data) => {
          const fields = data.match(/^data:(.*);(.*),(.*)$/);
          files[i].preview = fields[0];
        });
        validFiles.push(files[i]);
      }
    }
    this.setState({
      files: concat(this.state.files, validFiles),
    });
  };

  /**
   * Cancel handler
   * @method onCancel
   * @returns {undefined}
   */
  onCancel() {
    this.props.onCancel();
    this.setState({
      files: [],
    });
  }

  /**
   * Submit handler
   * @method onSubmit
   * @returns {undefined}
   */
  async onSubmit(){
    this.setState({uploading: true,});
    // Read all files as Data URLs
    const files = await Promise.all(this.state.files.map(file => readAsDataURL(file)));
    // Process each file and create the content data
    const contentData = await Promise.all(this.state.files.map(async (file, index) => {
      const fields = files[index].match(/^data:(.*);(.*),(.*)$/);
      const image = fields[1].split('/')[0] === 'image';
      
      let description = null;
      let title = null;
      if (image) {
        ({ description, title } = await describer.processImage(file));
      }

      return {
        '@type': image ? 'Image' : 'File',
        title: image? title: file.name,
        description: image ? description : null,
        [image ? 'image' : 'file']: {
          data: fields[3],
          encoding: fields[2],
          'content-type': fields[1],
          filename: file.name,
        },
      };
    }));

    // Call createContent with the processed data
    this.props.createContent(
      this.props.pathname,
      contentData,
      SUBREQUEST,
    );
  };
  

  /**
   * Render method.
   * @method render
   * @returns {string} Markup for the component.
   */
  render() {
    return (
      this.props.open && (
        <Modal open={this.props.open}>
          <Header>
            <FormattedMessage id="Upload files" defaultMessage="Upload files" />
          </Header>
          <Dimmer active={this.props.request.loading}>
            <Loader>
              <FormattedMessage
                id="Uploading files"
                defaultMessage="Uploading files"
              />
            </Loader>
          </Dimmer>
          <Modal.Content>
            <Dropzone
              onDrop={this.onDrop}
              className="dropzone"
              noDragEventsBubbling={true}
              multiple={true}
            >
              {({ getRootProps, getInputProps }) => (
                <div {...getRootProps({ className: 'dashed' })}>
                  <Segment>
                    <Table basic="very">
                      <Table.Body>
                        <Table.Row>
                          <Table.Cell>
                            <FormattedMessage
                              id="Drag and drop files from your computer onto this area or click the “Browse” button."
                              defaultMessage="Drag and drop files from your computer onto this area or click the “Browse” button."
                            />
                          </Table.Cell>
                          <Table.Cell>
                            <Button className="ui button primary">
                              <FormattedMessage
                                id="Browse"
                                defaultMessage="Browse"
                              />
                            </Button>
                            <input
                              {...getInputProps({
                                type: 'file',
                                style: { display: 'none' },
                              })}
                            />
                          </Table.Cell>
                        </Table.Row>
                      </Table.Body>
                    </Table>
                  </Segment>
                </div>
              )}
            </Dropzone>
            {this.state.files.length > 0 && (
              <Table compact singleLine>
                <Table.Header>
                  <Table.Row>
                    <Table.HeaderCell width={8}>
                      <FormattedMessage
                        id="Filename"
                        defaultMessage="Filename"
                      />
                    </Table.HeaderCell>
                    <Table.HeaderCell width={4}>
                      <FormattedMessage
                        id="Last modified"
                        defaultMessage="Last modified"
                      />
                    </Table.HeaderCell>
                    <Table.HeaderCell width={4}>
                      <FormattedMessage
                        id="File size"
                        defaultMessage="File size"
                      />
                    </Table.HeaderCell>
                    <Table.HeaderCell width={4}>
                      <FormattedMessage id="Preview" defaultMessage="Preview" />
                    </Table.HeaderCell>
                    <Table.HeaderCell />
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {map(this.state.files, (file, index) => (
                    <Table.Row className="upload-row" key={file.name}>
                      <Table.Cell>{file.name}</Table.Cell>
                      <Table.Cell>
                        {file.lastModifiedDate && (
                          <FormattedRelativeDate date={file.lastModifiedDate} />
                        )}
                      </Table.Cell>
                      <Table.Cell>
                        {filesize(file.size, { round: 0 })}
                      </Table.Cell>
                      <Table.Cell>
                        {file.type.split('/')[0] === 'image' && (
                          <Image src={file.preview} height={60} />
                        )}
                      </Table.Cell>
                      <Table.Cell>
                        <Icon
                          name="close"
                          value={index}
                          link
                          onClick={this.onRemoveFile}
                        />
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table>
            )}
          </Modal.Content>
          <Modal.Actions>
            {this.state.files.length > 0 && (
              <Button
                basic
                circular
                primary
                floated="right"
                icon="arrow right"
                aria-label={this.props.intl.formatMessage(messages.upload, {
                  count: this.state.files.length,
                })}
                onClick={this.onSubmit} 
                title={this.props.intl.formatMessage(messages.upload, {
                  count: this.state.files.length,
                })}
                size="big"
              />
            )}
          {this.state.uploading && (
                        <Dimmer active>
                          <Loader indeterminate>
                            {this.props.intl.formatMessage(
                              messages.uploadingImage,
                            )}
                          </Loader>
                        </Dimmer>
                      )}
            <Button
              basic
              circular
              secondary
              icon="remove"
              aria-label={this.props.intl.formatMessage(messages.cancel)}
              title={this.props.intl.formatMessage(messages.cancel)}
              floated="right"
              size="big"
              onClick={this.onCancel}
            />
          </Modal.Actions>
        </Modal>
      )
    );
  }
}

export default compose(
  injectIntl,
  connect(
    (state) => ({
      request: state.content.subrequests?.[SUBREQUEST] || {},
    }),
    { createContent },
  ),
)(ContentsUploadModal);
