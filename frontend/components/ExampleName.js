import { React, axios, connect, elements, ExportableGrid, GenericForm, Modal, GridManager } from 'perun-core'
const { ReactBootstrap, alertUser } = elements
import './style.css'


const ExampleName = ({ session }) => {
    const [data, setData] = React.useState([]);
    const [selectedItem, setSelectedItem] = React.useState();
    const [selectedSubItem, setSelectedSubItem] = React.useState(null);
    const [show, setShow] = React.useState(false);
    const [modal, setModal] = React.useState(undefined);
    const [table_, setTableName] = React.useState(null);
    const [objectId, setObjectId] = React.useState(0)
    const [openSubmenus, setOpenSubmenus] = React.useState([]);
    const [readOnly, setReadOnly] = React.useState(null)

    const formId = table_ + '_FORM'
    const gridId = table_ + '_GRID'



    const url = window.server + `/WsAdminConsole/get-configuration/sid/${session}/component-name/intern-test-menu`
    React.useEffect(() => {
        axios.get(url)
            .then(response => {
                setData(response.data.data);
            })
            .catch(error => {
                console.error('Error fetching data:', error);
                alertUser(true, error.data.type.toLowerCase(), error.data.title, error.data.message)
            });
    }, [session]);

    const handleItemClick = (item) => {

        setSelectedItem(item);

        if (item.data && item.data.length > 0) {

            setOpenSubmenus((prevOpenSubmenus) =>
                prevOpenSubmenus.includes(item.ID)
                    ? prevOpenSubmenus.filter((id) => id !== item.ID)
                    : [...prevOpenSubmenus, item.ID]
            );

        }
        setSelectedSubItem(null);


    };


    const handleSubItemClick = (subItem) => {
        setSelectedSubItem(subItem);

    };


    React.useEffect(() => {
        console.log("Selected SubItem Changed:", selectedSubItem);
    }, [selectedSubItem]);


    const isSubmenuOpen = (item) => openSubmenus.includes(item.ID);

    const generateForm = (objecidUser, table) => {


        const form = (<GenericForm
            key={formId}
            id={formId}
            method={`/ReactElements/getTableJSONSchema/${session}/` + table}
            uiSchemaConfigMethod={`/ReactElements/getTableUISchema/${session}/${table}`}
            tableFormDataMethod={`/ReactElements/getTableFormData/${session}/${objecidUser}/${table}`}
            addSaveFunction={(e) => saveRecord(e)}
            addDeleteFunction={deleteRecord}
        />
        );

        generateModal(form)

    }


    const addRow = () => {

        const form = (<GenericForm
            key={formId}
            id={formId}
            method={`/ReactElements/getTableJSONSchema/${session}/${table_}`}
            uiSchemaConfigMethod={`/ReactElements/getTableUISchema/${session}/${table_}`}
            tableFormDataMethod={`/ReactElements/getTableFormData/${session}/${objectId}/${table_}`}
            addSaveFunction={(e) => saveRecord(e)}
            addDeleteFunction={deleteRecord}
        />
        );

        generateModal(form)

    }

    const generateModal = (form) => {

        setShow(true);
        const modal = (

            <Modal
                show={show}
                id={selectedItem.ID}
                key={selectedItem.ID}
                modalContent={form}
                closeModal={closeModal}
                onHide={() => { setShow(false) }}

            />
        );
        setModal(modal);

    }


    const onRowClick = (_gridId, _rowId, row) => {
        setShow(true);
        const tableName = getTableNameFromId(selectedItem);
        const objecidUser = row[`${tableName}.OBJECT_ID`];
        setObjectId(objecidUser);
        generateForm(objecidUser, tableName);


    }

    React.useEffect(() => {
        if (selectedItem) {
            const tableName = getTableNameFromId(selectedItem);
            setTableName(tableName);
        }
    }, [selectedItem]);


    const deleteRecord = (gridId_, tableName, session_, params) => {
        if (readOnly) {
            alertUser(true, 'error', "You cannot save records ");
            setShow(false);
            return;
        }

        const url = window.server + `/ReactElements/deleteObject/${session}`
        const formData = params[4].PARAM_VALUE
        const data = encodeURIComponent(JSON.stringify(JSON.parse(formData)))

        axios({
            method: 'post',
            data,
            url,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },

        }).
            then(res => {

                if (res.data) {

                    alertUser(true, res.data.type.toLowerCase(), "Record deleted")
                    setShow(false);
                    GridManager.reloadGridData(gridId)
                }

            }).catch(error => {
                console.error('Error fetching data:', error);
                alertUser(true, res.data.type.toLowerCase(), "You cannot delete records in this table")

            })
    }
    const saveRecord = (e) => {

        if (readOnly) {
            alertUser(true, 'error', "You cannot save records ");
            setShow(false);
            return;
        }

        const url = window.server + `/ReactElements/createTableRecordFormData/${session}/${table_}/0`
        axios({
            method: 'post',
            data: encodeURIComponent(JSON.stringify(e.formData)),
            url,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },

        }).
            then(res => {
                if (res.data) {
                    const resType = res.data.type.toLowerCase()
                    alertUser(true, resType, res.data.title)
                    if (resType === 'success')
                        setShow(false);
                    GridManager.reloadGridData(gridId)

                }
            }).catch(error => {
                alertUser(true, res.data.type.toLowerCase(), "You cannot save records in this table")
                console.error('Error fetching data:', error);

            })
    }

    const closeModal = () => {
        GridManager.reloadGridData(gridId)
        setShow(false);

    };

    const getTableNameFromId = (selectedItem) => {
        return selectedItem.ID.replace(/_\d+$/, '');

    };


    const typeGrid = (item) => {
        return item && item.objectConfiguration && item.objectConfiguration.type === 'grid';
    };
    const Grid = ({ item }) => {
        if (typeGrid(item)) {
            const readOnly = item?.objectConfiguration?.form?.configuration?.readOnly;

            if (readOnly === true) {
                setReadOnly(true);
            }

            return (
                <ExportableGrid
                    id={gridId}
                    key={gridId}
                    configTableName={item.objectConfiguration.configuration?.onSubmit}
                    dataTableName={item.objectConfiguration.data?.onSubmit}
                    onRowClickFunct={onRowClick}
                    toggleCustomButton={!readOnly && true}
                    customButton={addRow}
                    customButtonLabel='Add'
                />
            );
        } else if (selectedItem && selectedItem.objectConfiguration && selectedItem.objectConfiguration.type === 'form') {
            return (
                <>
                    <GenericForm
                        key={gridId}
                        id={gridId}
                        method={selectedItem.objectConfiguration.configuration?.onSubmit}
                        uiSchemaConfigMethod={selectedItem.objectConfiguration.uischema?.onSubmit}
                        tableFormDataMethod={selectedItem.objectConfiguration.data?.onSubmit}
                    />
                </>
            );
        } else {
            return null;
        }
    };


    return (
        <>
            <div className='flex-parent parent-margin'>
                <div className='sidebar'>
                    <div className='flex-column'>
                        <div className='flex-parent admin-console-side-bar-content'>
                            <div className='nav-menu'>
                                return (
                                <ul className='menu-list'>
                                    {data.map((item) => (
                                        <>
                                            <li
                                                key={item.ID}
                                                className={item.data ? 'var_nav_arrow' : 'var_nav'}
                                                onClick={() => handleItemClick(item)}
                                                tabIndex='1'
                                            >
                                                <div className={`link_bg`}></div>
                                                <div className='title_'>
                                                    <div class='menu-links' >
                                                        {item.label}
                                                    </div>
                                                </div>
                                            </li>
                                            {isSubmenuOpen(item) && (
                                                <div>
                                                    {item.data.map((subItem) => (
                                                        <div
                                                            key={subItem.ID}
                                                            onClick={() => handleSubItemClick(subItem)}
                                                            className={`submenu ${selectedSubItem === subItem ? 'active' : ''}`}
                                                        >
                                                            <div className='subItem-label' >{subItem.label} </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </>
                                    ))}
                                </ul>
                                );
                            </div>
                        </div>
                    </div>
                </div>
                <div className="content">
                    <div className='admin-console-grid-container'>
                        <Grid item={typeGrid(selectedSubItem) ? selectedSubItem : selectedItem} />

                        {selectedItem && show && modal || selectedSubItem && show && modal}
                    </div>
                </div>
            </div >
        </>
    );
}

const mapStateToProps = (state) => ({
    session: state.security.svSession
});

export default connect(mapStateToProps)(ExampleName)


