import React, { Component } from 'react'
import { Table, Card, Badge, Select, Button, Modal, Row, Col, message, Popconfirm } from 'antd';
import PropTypes from 'prop-types';
import { autobind } from 'core-decorators';
import { connect } from 'react-redux';
import { fetchGroupMemberList } from '../../../../reducer/modules/group.js';
import { getProjectMsg, getProjectMemberList, addMember, delMember, changeMemberRole } from '../../../../reducer/modules/project.js';
import UsernameAutoComplete from '../../../../components/UsernameAutoComplete/UsernameAutoComplete.js';
import '../Setting.scss';

const Option = Select.Option;

const arrayAddKey = (arr) => {
  return arr.map((item, index) => {
    return {
      ...item,
      key: index
    }
  });
}

@connect(
  state => {
    return {
      projectMsg: state.project.projectMsg,
      uid: state.user.uid
    }
  },
  {
    fetchGroupMemberList,
    getProjectMsg,
    getProjectMemberList,
    addMember,
    delMember,
    changeMemberRole
  }
)
class ProjectMember extends Component {
  constructor(props) {
    super(props);
    this.state = {
      groupMemberList: [],
      projectMemberList: [],
      groupName: '',
      role: '',
      visible: false,
      dataSource: [],
      inputUid: 0,
      inputRole: 'dev'
    }
  }
  static propTypes = {
    projectId: PropTypes.number,
    projectMsg: PropTypes.object,
    uid: PropTypes.number,
    addMember: PropTypes.func,
    delMember: PropTypes.func,
    changeMemberRole: PropTypes.func,
    fetchGroupMemberList: PropTypes.func,
    getProjectMsg: PropTypes.func,
    getProjectMemberList: PropTypes.func
  }
  @autobind
  showAddMemberModal() {
    this.setState({
      visible: true
    });
  }

  // 重新获取列表
  @autobind
  reFetchList() {
    this.props.getProjectMemberList(this.props.projectId).then((res) => {
      this.setState({
        projectMemberList: arrayAddKey(res.payload.data.data),
        visible: false
      });
    });
  }

  // 增 - 添加成员
  @autobind
  handleOk() {
    console.log(this.props.projectId, this.state.inputUid);
    this.props.addMember({
      id: this.props.projectId,
      member_uid: this.state.inputUid
    }).then((res) => {
      console.log(res);
      if (!res.payload.data.errcode) {
        message.success('添加成功!');
        this.reFetchList(); // 添加成功后重新获取分组成员列表
      }
    });
  }
  // 添加成员时 选择新增成员权限
  @autobind
  changeNewMemberRole(value) {
    return () => {
      console.log(this.props.projectId, value);
    }
  }

  // 删 - 删除分组成员
  @autobind
  deleteConfirm(member_uid) {
    return () => {
      const id = this.props.projectId;
      this.props.delMember({ id, member_uid }).then((res) => {
        if (!res.payload.data.errcode) {
          message.success(res.payload.data.errmsg);
          this.reFetchList(); // 添加成功后重新获取分组成员列表
        }
      });
    }
  }

  // 改 - 修改成员权限
  @autobind
  changeUserRole(e) {
    console.log(e);
    const id = this.props.projectId;
    const role = e.split('-')[0];
    const member_uid = e.split('-')[1];
    this.props.changeMemberRole({ id, member_uid, role }).then((res) => {
      if (!res.payload.data.errcode) {
        message.success(res.payload.data.errmsg);
        this.reFetchList(); // 添加成功后重新获取分组成员列表
      }
    });
  }

  // 关闭模态框
  @autobind
  handleCancel() {
    this.setState({
      visible: false
    });
  }

  @autobind
  onUserSelect(childState) {
    console.log(childState);
    this.setState({
      inputUid: childState.uid
    })
  }
  
  async componentWillMount() {
    const groupMemberList = await this.props.fetchGroupMemberList(this.props.projectMsg.group_id);
    const rojectMsg = await this.props.getProjectMsg(this.props.projectId);
    const projectMemberList = await this.props.getProjectMemberList(this.props.projectId);
    this.setState({
      groupMemberList: groupMemberList.payload.data.data,
      groupName: this.props.projectMsg.group_name,
      projectMemberList: arrayAddKey(projectMemberList.payload.data.data),
      role: rojectMsg.payload.data.data.role
    })
  }

  render () {
    console.log(this.props);
    console.log(this.state);
    const columns = [{
      title: ' 项目成员 ('+this.state.projectMemberList.length + ') 人',
      dataIndex: 'username',
      key: 'username',
      render: (text, record) => {
        return (<div className="m-user">
          <img src={location.protocol + '//' + location.host + '/api/user/avatar?uid=' + record.uid} className="m-user-img" />
          <p className="m-user-name">{text}</p>
        </div>);
      }
    }, {
      title: (this.state.role === 'owner' || this.state.role === 'admin') ? <div className="btn-container"><Button className="btn" type="primary" icon="plus" onClick={this.showAddMemberModal}>添加成员</Button></div> : '',
      key: 'action',
      className: 'member-opration',
      render: (text, record) => {
        if (this.state.role === 'owner' || this.state.role === 'admin') {
          return (
            <div>
              <Select defaultValue={record.role+'-'+record.uid} className="select" onChange={this.changeUserRole}>
                <Option value={'owner-'+record.uid}>组长</Option>
                <Option value={'dev-'+record.uid}>开发者</Option>
              </Select>
              <Popconfirm placement="topRight" title="你确定要删除吗? " onConfirm={this.deleteConfirm(record.uid)} okText="确定" cancelText="">
                <Button type="danger" icon="minus" className="btn-danger" />
              </Popconfirm>
            </div>
          )
        } else {
          return '';
        }
      }
    }];
    return (
      <div className="m-panel">
        <Modal
          title="添加成员"
          visible={this.state.visible}
          onOk={this.handleOk}
          onCancel={this.handleCancel}
          >
          <Row gutter={6} className="modal-input">
            <Col span="5"><div className="label">用户名: </div></Col>
            <Col span="15">
              <UsernameAutoComplete callbackState={this.onUserSelect} />
            </Col>
          </Row>
          <Row gutter={6} className="modal-input">
            <Col span="5"><div className="label">权限: </div></Col>
            <Col span="15">
              <Select size="large" defaultValue="dev" className="select" onChange={this.changeNewMemberRole}>
                <Option value="owner">组长</Option>
                <Option value="dev">开发者</Option>
              </Select>
            </Col>
          </Row>
        </Modal>
        <Table columns={columns} dataSource={this.state.projectMemberList} pagination={false} />
        <Card title={this.state.groupName + ' 分组成员 ' + '(' + this.state.groupMemberList.length + ') 人'} noHovering className="setting-group">
          {this.state.groupMemberList.map((item, index) => {
            return (<div key={index} className="card-item">
              <img src={location.protocol + '//' + location.host + '/api/user/avatar?uid=' + item.uid} className="item-img" />
              <p className="item-name">{item.username}</p>
              {item.uid === this.props.uid ? <Badge count={'我'} style={{ backgroundColor: '#689bd0', marginLeft: '8px', borderRadius: '4px' }} /> : null}
              {item.role === 'owner' ? <p className="item-role">组长</p> : null}
              {item.role === 'dev' ? <p className="item-role">开发者</p> : null}
            </div>);
          })}
        </Card>
      </div>
    )
  }
}

export default ProjectMember;
