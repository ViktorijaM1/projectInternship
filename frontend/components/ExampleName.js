import { React, axios, connect, elements, GenericForm, Modal, GridManager } from 'perun-core'
const { alertUser } = elements
import Grid from './Type'
import './style.css'


const ExampleName = ({ session }) => {
    const [data, setData] = React.useState([]);
    const [selectedItem, setSelectedItem] = React.useState();
    const [selectedSubItem, setSelectedSubItem] = React.useState(null);
    const [modal, setModal] = React.useState(undefined);
    const [table_, setTableName] = React.useState(null);
    const [openSubmenus, setOpenSubmenus] = React.useState([]);
    const [readOnly, setReadOnly] = React.useState(null);


    const formId = table_ + '_FORM'
    const gridId = table_ + '_GRID'

    const hideBtns = !readOnly ? '' : 'all'

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
    }, []);

    const handleItemClick = (item) => {

        setSelectedItem(item);
        setReadOnly(item.objectConfiguration?.form?.configuration?.readOnly);
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
        setReadOnly(subItem.objectConfiguration?.form?.configuration?.readOnly);

    };


    React.useEffect(() => {
        console.log("Selected SubItem Changed:", selectedSubItem);
    }, [selectedSubItem]);


    const isSubmenuOpen = (item) => openSubmenus.includes(item.ID);

    const showModal = (objectId) => {

        const saveRecord = (e) => {

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
                            closeModal();
                        GridManager.reloadGridData(gridId)

                    }
                }).catch(error => {
                    alertUser(true, res.data.type.toLowerCase(), "You cannot save records in this table")
                    console.error('Error fetching data:', error);

                })
        }

        const form = (<GenericForm
            key={formId}
            id={formId}
            method={`/ReactElements/getTableJSONSchema/${session}/${table_}`}
            uiSchemaConfigMethod={`/ReactElements/getTableUISchema/${session}/${table_}`}
            tableFormDataMethod={`/ReactElements/getTableFormData/${session}/${objectId}/${table_}`}
            addSaveFunction={(e) => saveRecord(e)}
            addDeleteFunction={deleteRecord}
            hideBtns={hideBtns}
            disabled={readOnly}
        />

        );

        const modal = (

            <Modal
                id={selectedItem.ID}
                key={selectedItem.ID}
                modalContent={form}
                closeModal={closeModal}
                closeAction={closeModal}

            />
        );
        setModal(modal);
    }


    const onRowClick = (_gridId, _rowId, row) => {

        const tableName = getTableNameFromId(selectedItem);
        const objecidUser = row[`${tableName}.OBJECT_ID`];
        setTableName(tableName);
        showModal(objecidUser)

    }

    const closeModal = () => {
        setModal(false)

    }


    React.useEffect(() => {
        if (selectedItem) {
            const tableName = getTableNameFromId(selectedItem);
            setTableName(tableName);
        }
    }, [selectedItem]);


    const deleteRecord = (gridId_, tableName, session_, params) => {


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
                    closeModal();
                    GridManager.reloadGridData(gridId)
                }

            }).catch(error => {
                console.error('Error fetching data:', error);
                alertUser(true, res.data.type.toLowerCase(), "You cannot delete records in this table")

            })
    }


    const getTableNameFromId = (selectedItem) => {
        return selectedItem.ID.replace(/_\d+$/, '');

    };

    return (
        <>
            <nav className="sidebar-menu">
                <ul className="navbar-nav mr-auto">
                    {data.map((item) => (
                        <li className="nav-item" key={item.id}>
                            <a
                                className={`nav-link ${item.data && item.data.length > 0 ? 'dropdown-toggle' : ''}`}
                                onClick={() => handleItemClick(item)}
                            >
                                {item.label}

                            </a>
                            {isSubmenuOpen(item) && (
                                <div className="dropdown-menu" aria-labelledby={`navbarDropdown${item.id}`}>
                                    {item.data.map((subItem) => (
                                        <a key={subItem.id} className="dropdown-item" onClick={() => handleSubItemClick(subItem)}>
                                            {subItem.label}
                                        </a>
                                    ))}
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            </nav>


            <div className='container grid-container'>

                <Grid
                    item={selectedSubItem ? selectedSubItem : selectedItem}
                    showModal={showModal}
                    readOnly={readOnly}
                    gridId={gridId}
                    onRowClick={onRowClick}
                />

                {selectedItem && modal}
            </div>

        </>
    );
}


const mapStateToProps = (state) => ({
    session: state.security.svSession
});

export default connect(mapStateToProps)(ExampleName)


